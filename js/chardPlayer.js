//Should already be init in chardAudioProcessors which this depends on
var Chard = Chard || {};

//Dependency on jQuery
Chard.ChardPlayer = (function($){
	"use strict";
	var module = {};
	
	//Check for web audio extension support and initialize
	if(window.AudioContext||window.webkitAudioContext) {
		module.webAudioSupported = true;
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		module.audioContext = new window.AudioContext(); 
	} else {
		module.webAudioSupported = false;
	}
	
	module.loadAudio = function(selector, playlistRef) {
		module.audioElement = $(selector)[0];
		
		if(module.audioElement) {
		  module.loadPlaylist(playlistRef);
			
			//Need to load the audio element first otherwise the AudioGraph fails
			module.loadNextSong();
			
			module.audioLoaded = true;
			
			//Bind waiting onplay event listener
			if(module.onloadHook) {
				module.audioElement.addEventListener('loadeddata', module.onloadHook);
				module.onloadHook = null;
			}
			
			//If Web Audio is enabled, route our audio input through the context so we can write in routing later
			if(module.webAudioSupported) {
				module.audioSource = module.audioContext.createMediaElementSource(module.audioElement);
				
				//Store the value of the AudioNode that feeds into the context destination
				module.lastNode = module.audioSource;
				
				//Register the filter path/routing. Currently is just serial
				
				//Register the parameter EQ filter
				//module.registerParametricEQ();
				
				//Register the graphic EQ filter
				//module.registerGraphicEQ();
				
				//Wire last node to the output finally
				module.lastNode.connect(module.audioContext.destination);
			}
		} else {
			module.audioLoaded = false;
		}
	};
	
	module.loadPlaylist = function(playlistRef) {
		
		if(module.playlist) {
			return;
		}
		
		//$.ajax('playlist.json');
		
		if(typeof playlistRef === 'string') {
		    //TODO: load the playlist properly
			$.ajax({ 
				url: playlistRef 
			}).done(function( data ) {
				module.playlist = data;
			});;
		}
		
		//Assuming we got the proper JSON object
		module.playlist = playlistRef;
			
		if(!module.playlist.songs) {
			return;
		}
		
		if(!module.playlist.options) {
			module.playlist.options = {};
		}
	};
	
	module.registerPlaylistViewUpdater = function(playlistViewCallback) {
		module.playlistViewUpdater = playlistViewCallback;
	};
	
	//Return the song meta data
	module.loadPrevSong = function() {
	  var songRef = null,
		  playlist = module.playlist,
		  songs = playlist.songs,
			options = playlist.options;
		
		if(module.audioElement && playlist) {
		
			//Cycle current song into next position
			songs.unshift(songs.pop());
			
			//Get the previous song
		  songRef = songs.pop();
			songs.push(songRef);
			
		  //Update playlist
			if(module.playlistViewUpdater) {
				module.playlistViewUpdater(songRef);
			}
			
			$(module.audioElement).children('source').attr('src',songRef.filename);
			
			//Need to load the element first otherwise the AudioGraph fails
			module.audioElement.load();
			
			//Register new seek bar if this isn't the first song
			if(module.audioLoaded && module.seekListenerFn) {
			  module.registerSeekBar(module.seekListenerFn);
			}
		}
		
		return songRef;
	};
	
	//Return the song meta data
	module.loadNextSong = function() {
	  var songRef = null,
		  playlist = module.playlist,
		  songs = playlist.songs,
			options = playlist.options;
		
		if(module.audioElement && playlist) {
		
			songRef = songs.shift();
			
		  //Update playlist before we shift
			if(module.playlistViewUpdater) {
				module.playlistViewUpdater(songRef);
			}
			
			$(module.audioElement).children('source').attr('src',songRef.filename);
			
			//Need to load the element first otherwise the AudioGraph fails
			module.audioElement.load();
			
			//Cycle it back at the end
			if(options.cycle) {
		 	  songs.push(songRef);
			}
			
			//Register new seek bar if this isn't the first song
			if(module.audioLoaded && module.seekListenerFn) {
			  module.registerSeekBar(module.seekListenerFn);
			}
		}
		
		return songRef;
	};
	
	module.loadSongByTitle = function(songTitle) {
	  var songRef = null,
		  playlist = module.playlist,
		  songs = playlist.songs,
			options = playlist.options,
			prevSongs = [],
			nextSongs = [];
		
		if(module.audioElement && playlist) {
		
			
			songs.forEach(function(elem, idx) {
				if(elem.title === songTitle) {
					songRef = elem;
				} else if(songRef) {
					nextSongs.push(elem);
				} else {
					prevSongs.push(elem);
				}
			});
			
			if(!songRef) {
				throw "Song does not exist";
			}
			
			//Rebuild the playlist
			//Cycle it back at the end
			if(options.cycle) {
		 	  nextSongs = nextSongs.concat(prevSongs);
				nextSongs.push(songRef);
			}
			
			playlist.songs = nextSongs;
			
		  //Update playlist before we shift
			if(module.playlistViewUpdater) {
				module.playlistViewUpdater(songRef);
			}
			
			$(module.audioElement).children('source').attr('src',songRef.filename);
			
			//Need to load the element first otherwise the AudioGraph fails
			module.audioElement.load();
			
			//Register new seek bar if this isn't the first song
			if(module.audioLoaded && module.seekListenerFn) {
			  module.registerSeekBar(module.seekListenerFn);
			}
		}
		
		return songRef;
	};
	
	module.playAudio = function() {
		if(module.audioLoaded) {
			module.audioElement.play();
		}
	};
	
	module.pauseAudio = function() {
		if(module.audioLoaded) {
			module.audioElement.pause();
		}
	};
	
	module.changeVolume = function(volume) {
		if(module.audioLoaded) {
			module.audioElement.volume = Math.min(volume / 100.0, 1);
		}
	};
	
	module.registerSeekBar = function(seekListenerFn) {
		if(seekListenerFn) {
			module.seekListenerFn = seekListenerFn;
	
			if(module.seekIntervalReference) {
				clearInterval(module.seekIntervalReference);
			}
			
			if(module.audioElement) {
				module.audioElement.addEventListener('loadeddata', module.synchronizeSeek);
			} else {
				module.onloadHook = module.synchronizeSeek;
			}
		}
	};
	
	module.synchronizeSeek = function() {
		var seekable = null,
				seekUnitMillis = 1000,
				listenerFn = module.seekListenerFn,
				audioElement = module.audioElement;
				
		if(listenerFn && module.audioLoaded) {
			module.seekPosition = audioElement.currentTime;
			module.totalSeekAvailable = audioElement.duration;
			
			listenerFn(module.seekPosition, module.totalSeekAvailable);
			
			module.seekIntervalReference = setInterval(function() { 
				if(!audioElement.paused) {
					module.seekPosition = audioElement.currentTime;
					listenerFn(module.seekPosition, module.totalSeekAvailable);
				} else if( 2 > Math.abs( Math.floor(audioElement.currentTime) - Math.floor(module.totalSeekAvailable) )) {
					clearInterval(module.seekIntervalReference);
					module.audioElement.onplay = null;
					module.loadNextSong();
					module.playAudio();
				}
			}, seekUnitMillis);
		}
	};
	
	module.seek = function(seekValue) {
		if(module.audioLoaded && module.audioElement) {
			if(module.audioElement.fastSeek) {
				module.audioElement.fastSeek(seekValue);
			} else {
				module.audioElement.currentTime = seekValue;
			}

			module.seekPosition = seekValue;
		}
	};
	
	return module;
}($));