(function ($, undefined) {
	"use strict";

	// sent messages:
	// {method: 'subscribe', namespace: "player.embed.host", args: []}
	// {method: "volume", namespace: "player.embed.host", args: [0.5]}
	// {method: "play", namespace: "player.embed.host", args: [null]}
	// {method: "pause", namespace: "player.embed.host", args: [null]}
	// {method: "seek", namespace: "player.embed.host", args: [2000]}
	// {method: "mute", namespace: "player.embed.host", args: [true or false]}
	//
	// received messages:
	// {method: "bridgeplayerevent", namespace: "player.embed.client", args: ['progress']}
	//  seen args: ready, init, volumechange, viewerschange, progress, segmentchange,
	//             timeupdate, pause, stalled, waiting, loadedchannel, emptied,
	//             play, abort, durationchange, manifestExtraInfo, qualitychange,
	//             loadedmetadata, loadeddata, canplay, playing, canplaythrough
	//  guessed args: ended, offline

	// {
	//  args: [{
	//   channelName: "hyperrpg",
	//   currentTime: 0
	//   duration: 0,
	//   muted: false
	//   playback: "playing",
	//   qualitiesAvailable: [{
	//    bandwidth: 4303000,
	//    group: "chunked",
	//    name: "Source",
	//    resolution: "1920x1080"
	//   }, {
	//    bandwidth: 1760000,
	//    group: "high",
	//    name: "High",
	//    resolution: "1280x720"
	//   }, {
	//    bandwidth: 992000,
	//    group: "medium",
	//    name: "Medium",
	//    resolution: "852x480"
	//   }, {
	//    bandwidth: 692000,
	//    group: "low",
	//    name: "Low",
	//    resolution: "640x360"
	//   }, {
	//    bandwidth: 292000,
	//    group: "mobile",
	//    name: "Mobile",
	//    resolution: "400x226"
	//   }],
	//   quality: "chunked",
	//   videoID: "",
	//   viewers: 189,
	//   volume: 0.5
	//  }],
	//  method: "bridgestateupdate",
	//  namespace: "player.embed.client"
	// }

	// {
	// method: "bridgestorestateupdate",
	// namespace: "player.embed.client"
	//  args: [{
	//   viewercount: 1,
	//   stats: {
	//    videoStats: {
	//     bufferSize: 6,
	//     displayResolution : "854 x 480",
	//     fps : 30,
	//     hlsLatencyBroadcaster : 11,
	//     hlsLatencyEncoder : 9,
	//     memoryUsage : "64 MB",
	//     playbackRate : 3442.08,
	//     skippedFrames : 3,
	//     videoResolution : "1920 x 1080
	//    }
	//   }
	//  }]
	// }

	$.embedplayer.register({
		origin: ['https://player.twitch.tv', 'http://player.twitch.tv'],
		matches: function () {
			return $.nodeName(this, "iframe") && /^https?:\/\/player\.twitch\.tv\/\?(video|channel)/i.test(this.src);
		},
		init: function (data, callback) {
			var match = /^https?:\/\/player\.twitch\.tv\/\?([^#]*)/i.exec(this.src);
			var params = $.embedplayer.parseParams(match[1]);

			data.detail.duration = NaN;
			data.detail.currenttime = 0;
			data.detail.volume = 1;
			data.detail.commands = [];
			data.detail.origin = $.embedplayer.origin(this.src);
			data.detail.video = params.video;
			data.detail.channel = params.channel;
			data.detail.callbacks = {};

			send(this, data, 'subscribe');

			callback();
		},
		play: function (data) {
			send(this, data, 'play');
		},
		pause: function (data) {
			send(this, data, 'pause');
		},
		stop: function (data) {
			if (data.detail.video) {
				send(this, data, 'seek', 0);
			}
			send(this, data, 'pause');
		},
		volume: function (data, callback) {
			callback(data.detail.volume);
		},
		duration: function (data, callback) {
			callback(data.detail.duration);
		},
		currenttime: function (data, callback) {
			callback(data.detail.currenttime);
		},
		setVolume: function (data, volume) {
			send(this, data, 'volume', volume);
		},
		seek: function (data, position) {
			send(this, data, 'seek', position);
		},
		link: function (data) {
			return data.detail.video && data.detail.channel ? 'https://www.twitch.tv/'+data.detail.channel+'/v/'+data.detail.video :
				data.detail.channel ? 'https://www.twitch.tv/'+data.detail.channel : null;
		},
		parseMessage: function (event) {
			return {data: event.data};
		},
		processMessage: function (data, message, trigger) {
			if (message.data.namespace !== 'player.embed.client') {
				return;
			}

			// TODO: error?

			if (message.data.method === 'bridgeplayerevent') {
				if (data.state === 'init') {
					trigger('ready');
					var win = this.contentWindow;
					if (win && data.detail.commands) {
						for (var i = 0; i < data.detail.commands.length; ++ i) {
							win.postMessage(JSON.stringify(data.detail.commands[i]), data.detail.origin);
						}
						data.detail.commands = null;
					}
				}

				switch (message.data.args[0]) {
					case 'play':
						trigger('play');
						break;

					case 'pause':
						trigger('pause');
						break;

					case 'stalled':
					case 'waiting':
						trigger('buffering');
						break;

					case 'ended':
						trigger('finish');
						break;
				}
			}
			else if (message.data.method === 'bridgestateupdate') {
				var state = message.data.args[0];
				data.detail.channel = state.channelName;
				data.detail.video = state.videoID||null;

				if ('volume' in state && state.volume !== data.detail.volume) {
					data.detail.volume = state.volume;
					trigger('volumechange', {volume: state.volume});
				}

				if ('currentTime' in state && state.currentTime !== data.detail.currenttime) {
					data.detail.currenttime = state.currentTime;
					trigger('timeupdate', {currentTime: state.currentTime});
				}

				if ('duration' in state && state.duration !== data.detail.duration && (isFinite(state.duration) || isFinite(data.detail.duration))) {
					data.detail.duration = state.duration;
					trigger('durationchange', {duration: state.duration});
				}
			}
		}
	});

	function send (element, data, method) {
		var command = {
			namespace: 'player.embed.host',
			method: method,
			args: Array.prototype.slice.call(arguments, 3)
		};

		if (data.state === "init") {
			data.detail.commands.push(command);
		}
		else {
			var win = element.contentWindow;
			if (win) {
				win.postMessage(command, data.detail.origin);
			}
		}
	}
})(jQuery);
