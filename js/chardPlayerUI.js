var Chard = Chard || {};

//Dependency on jQuery
Chard.ChardPlayerUI = (function($){
	"use strict";
	var module = {};
	
	/** Helpers */
	
	var bindDelegatorAndListener = function(selector, delegator, listener) {
		var handler = function(event) {
			delegator(listener, event);
		};
		
		$(selector).click(handler);
	};
	
	var loadHtmlTemplate = function(templateUrl, containerSelector) {
		$.ajax({
			url: templateUrl,
		}).done(function( data ) {
			var template = data;
			$(containerSelector).prepend(template);
		});
	};
	
	//Implementation dependent
	var updateProgressBar = function(barSelector, progressBarSelector, progress, total, animate) {
		var bar = $(barSelector),
			progressBar = $(progressBarSelector),
			width = bar.width(),
			percentProgress = 100*(progress*1.0) / total;
		
		if(animate) {
			progressBar.animate({width: percentProgress+"%"}, 1000, 'linear');
		} else {
			progressBar.width(percentProgress+"%");
		}
	};
	
	//Time helper
	var convertTimeToDisplay = function(time) {
		var display = ""+time,
			minutes = 0,
			seconds = 0;

		minutes = Math.floor(time / 60);
		seconds = Math.floor(time - (minutes * 60));
		
		display = minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
		
		return display;
	};
	
	/** Standard Listeners / Delegators */
	
	var playlistViewUpdater = function(metaData) {
		var songTitle = "";
			
		if(metaData.title) {
			songTitle += metaData.title;
		}
		
		if(metaData.artist) {
			songTitle = metaData.artist + " - " + songTitle;
		}
		
		module.updateSongTitle(module.uiMap.songTitle, songTitle, metaData.linkUrl);
		
		if(metaData.artRef) {
			module.updateArt(module.uiMap.art, metaData.artRef);
		}
	};
	
	//Implementation dependent
	var songProgressListener = function(songProgress, totalSongLength, animate) {	
		if(totalSongLength) {
			module.updateSongLength(totalSongLength);
		}
		
		module.updateCurrentTime(songProgress);
		
		updateProgressBar(module.uiMap.seekBar, module.uiMap.seekBarEllapsed, songProgress, totalSongLength, animate);
	};
	
	var seekDelegator = function(seekListener, event) {
		var seekValue = 0,
			seekBarWidth = $(module.uiMap.seekBar).width(),
			currentSeek = $(module.uiMap.seekBarEllapsed),
			totalSongTime = module.player.totalSeekAvailable,
			seekPercent = event.offsetX / seekBarWidth;
			
		seekValue = Math.floor(totalSongTime * seekPercent);
		
		songProgressListener(seekValue, totalSongTime, false);
		
		seekListener(seekValue);
	};
	
	var volumeDelegator = function(volumeListener, event) {
		var volume = 100,
			volumeBarWidth = $(module.uiMap.volumeBar).width(),
			volumePercent = event.offsetX / volumeBarWidth;
		
		volume = 100 * volumePercent;
		
		updateProgressBar(module.uiMap.volumeBar, module.uiMap.volumeCurrent, volume, 100);
		
		if(volume > 0) { 
			$(module.uiMap.muteButton).removeClass('chardplayer-hide');
			$(module.uiMap.unmuteButton).addClass('chardplayer-hide');
		} else {
			$(module.uiMap.unmuteButton).removeClass('chardplayer-hide');
			$(module.uiMap.muteButton).addClass('chardplayer-hide');
		}
		
		volumeListener(volume);
	};
	
	/** Default Customization Maps */
	var STANDARD_UI_MAP = {
		seekBar: '.chardplayer-ui-seek-bar',
		seekBarEllapsed: '.chardplayer-ui-seek-ellapsed',
		volumeBar: '.chardplayer-ui-volume-bar',
		volumeCurrent: '.chardplayer-ui-current-volume',
		playButton: '.chardplayer-ui-play-button',
		pauseButton: '.chardplayer-ui-pause-button',
		prevSongButton: '.chardplayer-ui-prev-button',
		nextSongButton: '.chardplayer-ui-next-button',
		muteButton: '.chardplayer-ui-mute-button',
		unmuteButton: '.chardplayer-ui-unmute-button',
		art: '.chardplayer-ui-art-img',
		songTitle: '.chardplayer-ui-song-title',
		currentTime: '.chardplayer-ui-current-time',
		totalTime: '.chardplayer-ui-total-time'
	};
	
	var STANDARD_LISTENER_MAP = {
		songProgress: songProgressListener,
		seek: seekDelegator,
		volume: volumeDelegator,
		songData: playlistViewUpdater
	};
	
	var STANDARD_TEMPLATE_URLS = {
		player: 'chardPlayerTemplate.html',
		parametricEQ: 'parametricEQTemplate.html',
		graphicEQ: 'graphicEQTemplate.html'
	};
	
	/** Bootstrap */
	module.drawStandardTemplate = function(containerSelector, templateType) {
		loadHtmlTemplate(STANDARD_TEMPLATE_URLS[templateType], containerSelector);
	};
	
	module.drawCustomTemplate =  function(containerSelector, customTemplateUrl) {
		loadHtmlTemplate(customTemplateUrl, containerSelector);
	};
	
	module.drawPlayer = function(containerSelector) {
		module.drawStandardTemplate(containerSelector, STANDARD_TEMPLATE_URLS.player);
	};
	
	module.initialize = function(player, customUIMap, customListenerMap) {
		var uiMap = customUIMap || STANDARD_UI_MAP,
			listenerMap = customListenerMap || STANDARD_LISTENER_MAP;
		
		module.player = player;
		module.uiMap = uiMap;
		module.listenerMap = listenerMap;
	
		module.bindPlaylistListener(listenerMap.songData);
		
		player.registerSeekBar(listenerMap.songProgress);
		
		module.bindPlayPauseButton(uiMap.playButton, uiMap.pauseButton);
		module.bindMuteUnmuteButton(uiMap.muteButton, uiMap.unmuteButton, player.changeVolume);
		
		bindDelegatorAndListener(uiMap.seekBar, listenerMap.seek, player.seek);
		bindDelegatorAndListener(uiMap.volumeBar, listenerMap.volume, player.changeVolume);
		
		module.bindSongLoadButton = (function(updateFn) {
			return function() {
				var args = arguments,
				_shift = Array.prototype.shift.bind(args),
				selector =  _shift(),
				playerLoadFn = _shift();
				
				
				$(selector).click(function(event) {
					event.preventDefault();
					var songMetaData = playerLoadFn.apply(player, args);
					
					if(!module.paused) {
						module.player.playAudio();
					}
					
					updateFn(songMetaData);
				});
			}
		}(listenerMap.songData));
		
		module.bindSongLoadButton(uiMap.prevSongButton, player.loadPrevSong);
		module.bindSongLoadButton(uiMap.nextSongButton, player.loadNextSong);
	};
	
	/** DOM Event Listener Bind functions */
	module.bindPlaylistListener = function(listenerFn) {
		module.player.registerPlaylistViewUpdater(listenerFn);
	};

	module.bindPlayPauseButton = function(playSelector, pauseSelector) {
		module.paused = false;
		
		var playPauseFn = function() { 
			if(module.paused) { 
				module.player.playAudio();
				$(pauseSelector).removeClass('chardplayer-hide');
				$(playSelector).addClass('chardplayer-hide');
			} else {
				module.player.pauseAudio(); 
				$(playSelector).removeClass('chardplayer-hide');
				$(pauseSelector).addClass('chardplayer-hide');
			}
			
			module.paused = !module.paused;
		};
		
		$(playSelector).click(playPauseFn);
		$(pauseSelector).click(playPauseFn);
	};
	
	module.bindMuteUnmuteButton = function(muteSelector, unmuteSelector, listenerFn) {
		
		var lastVolumeWidth = $(module.uiMap.volumeCurrent).width();
		
		var muteFn = function() { 
			var currentVolumeWidth = $(module.uiMap.volumeCurrent).width();
			
			if(currentVolumeWidth === 0) {
				module.listenerMap.volume(listenerFn, {offsetX: lastVolumeWidth});
			} else {
				module.listenerMap.volume(listenerFn, {offsetX: 0});
				lastVolumeWidth = currentVolumeWidth;
			}
		};
		
		$(unmuteSelector).click(muteFn);
		$(muteSelector).click(muteFn);
	};
	
	/** DOM Update functions */
	
	module.updateSongTitle = function(selector, songTitle, songUrl) {
		$(selector).html(songTitle);
		
		if(typeof songUrl === 'string') {
			$(selector).attr('href', songUrl).attr('target','_blank');
		} else {
			$(selector).attr('href', '#').attr('target','');
		}
	};
	
	module.updateArt = function(selector, srcRef) {
		$(selector).attr('src',srcRef);
	};
	
	module.updateCurrentTime = function(currentTime) {
		$(module.uiMap.currentTime).html(convertTimeToDisplay(currentTime));
	};
	
	module.updateSongLength = function(songLength) {
		$(module.uiMap.totalTime).html(convertTimeToDisplay(songLength));
	};
	
	return module;
}($));