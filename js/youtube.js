(function ($, undefined) {
	"use strict";

	var event_map = {
		ready: null,
		play: null,
		pause: null,
		finish: null,
		buffering: null,
		timeupdate: null,
		durationchange: null,
		volumechange: null,
		error: "onError"
	};

	var next_id = 1;

	$.embedplayer.register({
		origin: 'https://www.youtube.com',
		matches: function () {
			return $.nodeName(this, "iframe") && /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/[-_a-z0-9]+.*[\?&]enablejsapi=1/i.test(this.src);
		},
		init: function (data, callback) {
			var self = this;
			data.detail.player_id = next_id ++;
			data.detail.origin = /^https?:\/\/(www\.)?youtube-nocookie\.com\//i.test(this.src) ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
			data.detail.duration = NaN;
			data.detail.currenttime = 0;
			data.detail.volume = 1;
			data.detail.commands = [];
			data.detail.video_id = /^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([-_a-z0-9]+)/i.exec(this.src)[1];
			data.detail.timer = setInterval(function () {
				if (!$.contains(self.ownerDocument.body, self)) {
					clearInterval(data.detail.timer);
					data.detail.timer = null;
					return;
				}
				else if (self.contentWindow) {
					self.contentWindow.postMessage(JSON.stringify({event:'listening', id:data.detail.player_id}), data.detail.origin);
				}
			}, 500);
			callback('youtube_'+data.detail.player_id);
		},
		play: function (data) {
			send(this, data, "playVideo");
		},
		pause: function (data) {
			send(this, data, "pauseVideo");
		},
		stop: function (data) {
			send(this, data, "stopVideo");
		},
		next: function (data) {
			send(this, data, "nextVideo");
		},
		prev: function (data) {
			send(this, data, "previousVideo");
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
			send(this, data, 'setVolume', volume*100);
		},
		seek: function (data, position) {
			send(this, data, 'seekTo', position);
		},
		listen: function (data, events) {
			var done = {};
			for (var i = 0; i < events.length; ++ i) {
				var event = event_map[events[i]];
				if (event && done[event] !== true) {
					done[event] = true;
					send(this, data, 'addEventListener', event);
				}
			}
		},
		link: function (data) {
			return 'https://www.youtube.com/watch?v='+data.detail.video_id;
		},
		parseMessage: function (event) {
			var message = {
				data: JSON.parse(event.data)
			};
			message.player_id = 'youtube_'+message.data.id;
			return message;
		},
		processMessage: function (data, message, trigger) {
			if (message.data.event === "infoDelivery") {
				var info = message.data.info;
				if (info) {
					if ('volume' in info) {
						var volume;
						if (info.muted) {
							volume = 0.0;
						}
						else {
							volume = info.volume / 100;
						}
						if (data.detail.volume !== volume) {
							data.detail.volume = volume;
							trigger("volumechange", {volume:volume});
						}
					}

					if ('playerState' in info) {
						switch (info.playerState) {
						case -1: // unstarted
							break;

						case  0: // ended
							trigger("finish");
							break;

						case  1: // playing
							trigger("play");
							break;

						case  2: // paused
							trigger("pause");
							break;

						case  3: // buffering
							trigger("buffering");
							break;

						case  5: // cued
							trigger("pause");
							break;
						}
					}

					if ('duration' in info) {
						if (info.duration !== data.detail.duration) {
							data.detail.duration = info.duration;
							trigger("durationchange", {duration:info.duration});
						}
					}

					if ('currentTime' in info) {
						if (info.currentTime !== data.detail.currenttime) {
							data.detail.currenttime = info.currentTime;
							trigger("timeupdate", {currentTime:info.currentTime});
						}
					}

					if ('videoData' in info) {
						data.detail.videoData = info.videoData;
					}

					if ('availableQualityLevels' in info) {
						data.detail.availableQualityLevels = info.availableQualityLevels;
					}
				}
			}
			else if (message.data.event === "initialDelivery") {
				if (data.detail.timer !== null) {
					clearInterval(data.detail.timer);
					data.detail.timer = null;
				}
			}
			else if (message.data.event === "onReady") {
				trigger("ready");
				var win = this.contentWindow;
				if (win && data.detail.commands) {
					for (var i = 0; i < data.detail.commands.length; ++ i) {
						win.postMessage(JSON.stringify(data.detail.commands[i]), data.detail.origin);
					}
					data.detail.commands = null;
				}
			}
			else if (message.data.event === "onError") {
				var error;
				switch (message.data.info) {
				case 2: // The request contains an invalid parameter value.
					error = "illegal_parameter";
					break;

				case 100: // The video requested was not found.
					error = "not_found";
					break;

				case 101: // The owner of the requested video does not allow it to be played in embedded players.
				case 150: // This error is the same as 101. It's just a 101 error in disguise!
					error = "forbidden";
					break;

				default:
					error = "error";
				}
				trigger("error", {error:error});
			}
		}
	});

	function send (element, data, func) {
		var command = {
			id: data.detail.player_id,
			event: "command",
			func: func,
			args: Array.prototype.slice.call(arguments, 3)
		};

		if (data.state === "init") {
			data.detail.commands.push(command);
		}
		else {
			var win = element.contentWindow;
			if (win) {
				win.postMessage(JSON.stringify(command), data.detail.origin);
			}
		}
	}
})(jQuery);
