(function ($, undefined) {
	function handlePlay(event) {
		var data = $.data(this, 'embedplayer');
		$.embedplayer.trigger(this, data, 'play');
	}

	function handlePause(event) {
		var data = $.data(this, 'embedplayer');
		$.embedplayer.trigger(this, data, 'pause');
	}

	function handleEnded(event) {
		var data = $.data(this, 'embedplayer');
		$.embedplayer.trigger(this, data, 'finish');
	}

	function handleWaiting(event) {
		var data = $.data(this, 'embedplayer');
		$.embedplayer.trigger(this, data, 'buffering');
	}

	function handleTimeupdate(event) {
		var data = $.data(this, 'embedplayer');
		$.embedplayer.trigger(this, data, 'timeupdate', {currentTime:this.currentTime});
	}

	function handleVolumechange(event) {
		var data = $.data(this, 'embedplayer');
		$.embedplayer.trigger(this, data, 'volumechange', {volume:this.volume});
	}

	function handleDurationchange(event) {
		var data = $.data(this, 'embedplayer');
		$.embedplayer.trigger(this, data, 'durationchange', {duration:this.duration});
	}

	function handleError(event) {
		var data = $.data(this, 'embedplayer');
		var error = 'error';
		if (this.error) {
			switch (this.error.code) {
				case MediaError.MEDIA_ERR_ABORTED:
					error = 'aborted';
					break;

				case MediaError.MEDIA_ERR_NETWORK:
					error = 'network_error';
					break;

				case MediaError.MEDIA_ERR_DECODE:
					error = 'decoding_error';
					break;

				case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
					error = 'src_not_supported';
					break;
			}
		}
		$.embedplayer.trigger(this, data, 'error', {
			error: error
		});
	}

	function handleLoadedmetadata(event) {
		var data = $.data(this, 'embedplayer');
		this.removeEventListener('loadedmetadata', handleLoadedmetadata, false);
		$.embedplayer.trigger(this, data, 'ready');
	}

	$.embedplayer.register({
		matches: function () {
			return $.nodeName(this, 'video') || $.nodeName(this, 'audio');
		},
		init: function (data, callback) {
			if (this.readyState === HTMLMediaElement.HAVE_METADATA) {
				var self = this;
				setTimeout(function () {
					$.embedplayer.trigger(self, data, 'ready');
				}, 0);
			}
			else {
				this.addEventListener('loadedmetadata', handleLoadedmetadata, false);
			}

			// initialize volume and duration
			$.embedplayer.trigger(this, data, 'volumechange', {volume:this.volume});
			if (!isNaN(this.duration)) {
				$.embedplayer.trigger(this, data, 'durationchange', {duration:this.duration});
			}

			callback();

			this.addEventListener('play', handlePlay, false);
			this.addEventListener('pause', handlePause, false);
			this.addEventListener('ended', handleEnded, false);
			this.addEventListener('waiting', handleWaiting, false);
			this.addEventListener('timeupdate', handleTimeupdate, false);
			this.addEventListener('volumechange', handleVolumechange, false);
			this.addEventListener('durationchange', handleDurationchange, false);
			this.addEventListener('error', handleError, false);
		},
		play: function (data) {
			this.play();
		},
		pause: function (data) {
			this.pause();
		},
		toggle: function (data) {
			if (this.paused) {
				this.play();
			}
			else {
				this.pause();
			}
		},
		stop: function (data) {
			this.pause();
			this.currentTime = 0;
		},
		volume: function (data, callback) {
			callback(this.volume);
		},
		duration: function (data, callback) {
			callback(this.duration);
		},
		currenttime: function (data, callback) {
			callback(this.currentTime);
		},
		setVolume: function (data, volume) {
			this.volume = Number(volume);
		},
		seek: function (data, position) {
			this.currentTime = Number(position);
		}
	});
})(jQuery);
