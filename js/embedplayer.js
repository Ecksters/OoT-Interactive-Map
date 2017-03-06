(function ($, undefined) {
	"use strict";

	$.embedplayer = {
		modules: [],
		modules_by_origin: {},
		defaults: {
			matches: function () { return false; },
			init: function (data, callback) { callback(); },
			play: function (data) {},
			pause: function (data) {},
			toggle: function (data) {
				if (data.state === "playing") {
					data.module.pause.call(this, data);
				}
				else {
					data.module.play.call(this, data);
				}
			},
			stop: function (data) { data.module.pause(data); },
			next: function (data) {},
			prev: function (data) {},
			listen: function (data, events) {},
			volume: function (data, callback) { callback(NaN); },
			duration: function (data, callback) { callback(NaN); },
			currenttime: function (data, callback) { callback(NaN); },
			setVolume: function (data, volume) {},
			seek: function (data, position) {},
			link: function (data) { return null; },
			parseMessage: function (event) {},
			processMessage: function (data, message, trigger) {},
			origin: []
		},
		register: function (module) {
			module = make_module(module);
			$.embedplayer.modules.push(module);
			for (var origin in module.origin) {
				if (origin in $.embedplayer.modules_by_origin) {
					throw new TypeError("already have embedplayer module for origin: "+origin);
				}
				$.embedplayer.modules_by_origin[origin] = module;
			}
		},
		origin: function (url) {
			if (/^\/\//.test(url)) {
				return location.protocol+"//"+url.split("/")[2];
			}
			else if (/^[-_a-z0-9]+:/i.test(url)) {
				return /^([-_a-z0-9]+:(?:\/\/)?[^\/]*)/i.exec(url)[1];
			}
			else {
				return location.protocol+'//'+location.host;
			}
		},
		parseParams: function (search) {
			var params = {};
			if (search) {
				search = search.split("&");
				for (var i = 0; i < search.length; ++ i) {
					var param = search[i].split("=");
					params[decodeURIComponent(param[0])] = decodeURIComponent(param.slice(1).join("="));
				}
			}
			return params;
		},
		trigger: function (self, data, type, properties) {
			var state = null;

			switch (type) {
			case "timeupdate":
			case "volumechange":
			case "durationchange":
			case "error":
				break;

			case "ready":
				state = "ready";
				break;

			case "play":
				state = "playing";
				break;

			case "pause":
				state = "paused";
				break;

			case "finish":
				state = "finished";
				break;

			case "buffering":
				state = "buffering";
				break;
			}

			if (state && state === data.state) {
				return;
			}

			if (state !== null) {
				data.state = state;
			}

			if (data.listening[type] === true) {
				var $self = $(self);
				if (state) $self.trigger($.Event('embedplayer:statechange', {state:state}));
				$self.trigger($.Event('embedplayer:'+type, properties));
			}
		}
	};

	function make_module (module) {
		module = $.extend({}, $.embedplayer.defaults, module);
		var origins = {};
		if (module.origin) {
			if (!$.isArray(module.origin)) {
				module.origin = [module.origin];
			}
			for (var i = 0; i < module.origin.length; ++ i) {
				var origin = module.origin[i];
				if (/^\/\//.test(origin)) {
					origins[location.protocol+origin] = true;
				}
				else {
					origins[origin] = true;
				}
			}
		}
		module.origin = origins;
		return module;
	}

	function init (self, options) {
		var data = $.data(self, 'embedplayer');
		if (!data) {
			var module = null;

			if (options) {
				module = make_module(options);
				for (var origin in module.origin) {
					if (origin in $.embedplayer.modules_by_origin) {
						throw new TypeError("already have embedplayer module for origin: "+origin);
					}
					$.embedplayer.modules_by_origin[origin] = module;
				}
			}
			else {
				for (var i = 0; i < $.embedplayer.modules.length; ++ i) {
					var candidate = $.embedplayer.modules[i];
					if (candidate.matches.call(self)) {
						module = candidate;
						break;
					}
				}
			}

			if (!module) {
				throw new TypeError("unsupported embed");
			}

			data = {
				module: module,
				state: 'init',
				listening: {
					ready: false,
					play: false,
					pause: false,
					finish: false,
					buffering: false,
					timeupdate: false,
					volumechange: false,
					durationchange: false,
					error: false
				},
				detail: {}
			};

			$.data(self, 'embedplayer', data);

			var ok = false;
			try {
				module.init.call(self, data, function (player_id) {
					data.player_id = player_id;
					$.attr(self, 'data-embedplayer-id', player_id === undefined ? '' : player_id);
				});
				ok = true;
			}
			finally {
				if (!ok) {
					// do it like that because catch and re-throw
					// changes the stack trace in some browsers
					$.removeData(self, 'embedplayer');
				}
			}
		}
		return data;
	}

	$.fn.embedplayer = function (command, options) {
		if (arguments.length === 0) {
			command = "init";
		}
		else if (arguments.length === 1 && typeof(command) === "object") {
			options = command;
			command = "init";
		}

		switch (command) {
		case "init":
			this.each(function () { init(this, options); });
			break;

		case "play":
		case "pause":
		case "stop":
		case "toggle":
		case "next":
		case "prev":
			this.each(function () {
				var data = init(this, options);
				data.module[command].call(this, data);
			});
			break;

		case "seek":
			var position = Number(arguments[1]);
			this.each(function () {
				var data = init(this, options);
				data.module.seek.call(this, data, position);
			});
			break;

		case "listen":
			var events = arguments.length > 1 ?
				arguments[1] :
				["ready", "play", "pause", "finish", "buffering", "timeupdate", "volumechange", "durationchange", "error"];
			if (!$.isArray(events)) {
				events = $.trim(events).split(/\s+/);
			}
			this.each(function () {
				var data = init(this);
				data.module.listen.call(this, data, events);
				for (var i = 0; i < events.length; ++ i) {
					data.listening[events[i]] = true;
				}
			});
			break;

		case "volume":
			if (arguments.length > 1 && typeof(arguments[1]) !== "function") {
				var volume = Number(arguments[1]);
				this.each(function () {
					var data = init(this);
					data.module.setVolume.call(this, data, volume);
				});
			}
			else if (this.length === 0) {
				(arguments[1]||$.noop)(NaN);
			}
			else {
				var data = init(this[0]);
				return data.module.volume.call(this[0], data, arguments[1]||$.noop);
			}
			break;

		case "duration":
		case "currenttime":
			if (this.length === 0) {
				(arguments[1]||$.noop)(NaN);
			}
			else {
				var data = init(this[0]);
				return data.module[command].call(this[0], data, arguments[1]||$.noop);
			}
			break;

		case "link":
			if (this.length === 0) {
				return null;
			}
			else {
				var data = init(this[0]);
				return data.module.link.call(this[0], data);
			}
			break;

		case "supported":
			for (var i = 0; i < this.length; ++ i) {
				var self = this[i];
				var supported = false;
				for (var j = 0; j < $.embedplayer.modules.length; ++ j) {
					var candidate = $.embedplayer.modules[j];
					if (candidate.matches.call(self)) {
						supported = true;
						break;
					}
				}
				if (!supported) {
					return false;
				}
			}
			return this.length > 0;

		default:
			throw new TypeError("unknown command: "+command);
		}

		return this;
	};

	window.addEventListener("message", function (event) {
		var module = $.embedplayer.modules_by_origin[event.origin];
		if (module) {
			var message = module.parseMessage(event);
			if (message) {
				var iframes = 'player_id' in message ?
					document.querySelectorAll('iframe[data-embedplayer-id="'+message.player_id+'"]') :
					document.getElementsByTagName('iframe');
				for (var i = 0; i < iframes.length; ++ i) {
					var iframe = iframes[i];
					if (iframe.contentWindow === event.source) {
						var data = init(iframe);
						data.module.processMessage.call(iframe, data, message, $.embedplayer.trigger.bind($.embedplayer, iframe, data));
						break;
					}
				}
			}
		}
	}, false);
})(jQuery);
