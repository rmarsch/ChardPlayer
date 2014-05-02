# ChardPlayer

ChardPlayer is an HTML5 Audio Player. The goal is to have a core audio player that can build out its
output path with modular signal processors.

For now it plays audio on the server given a selector for an HTML5 <audio> element and a playlist JSON object

I have a default slim horizontal player UI built out (live demo at http://www.parachutermusic.com), but have built out the UI layer separately from the audio 
management logic so it can be overridden.

For now there is a dependency on jQuery.

## Playlist JSON format

`songs`: array of song objects

`song` object:

* `filename` (required): string -- Path to the file. Currently only supports files hosted on the server.
* `title` (required): string -- Title of the song
* `artist`: string -- Artist/Composer/Performer of the song
* `artRef`: string -- img src reference to artwork
* `linkUrl`: string -- Optional href target for link from song title in the UI

`options`: object for setting option flags
* `cycle`: true | false -- flags whether the playlist should cycle or stop at the end

## UI API

`Chard.ChardPlayerUI` provides a standard implementation for creating the UI and relaying UI events and player events between the two components.

Standard Private Configurations:

`STANDARD_UI_MAP`: _Mapping for the jQuery Selectors to important UI elements_

  * `seekBar`: '.chardplayer-ui-seek-bar'
	* `seekBarEllapsed`: '.chardplayer-ui-seek-ellapsed'
	*	`volumeBar`: '.chardplayer-ui-volume-bar'
	*	`volumeCurrent`: '.chardplayer-ui-current-volume'
	*	`playButton`: '.chardplayer-ui-play-button'
	*	`pauseButton`: '.chardplayer-ui-pause-button'
	*	`prevSongButton`: '.chardplayer-ui-prev-button'
	*	`nextSongButton`: '.chardplayer-ui-next-button'
	*	`muteButton`: '.chardplayer-ui-mute-button'
	*	`unmuteButton`: '.chardplayer-ui-unmute-button'
	*	`art`: '.chardplayer-ui-art-img'
	*	`songTitle`: '.chardplayer-ui-song-title'
	*	`currentTime`: '.chardplayer-ui-current-time'
	*	`totalTime`: '.chardplayer-ui-total-time'  

`STANDARD_LISTENER_MAP`: _Mapping for important Listener and Delegator functions related to song progress, seeking, volume changes, and song changes_

  * `songProgress`: songProgressListener
	* `seek`: seekDelegator
	* `volume`: volumeDelegator
	* `songData`: playlistViewUpdater

`STANDARD_TEMPLATE_URLS`: _Default relative server paths to HTML template files for UI elements like the player._

  * `player`: 'chardPlayerTemplate.html'
	* `parametricEQ`: 'parametricEQTemplate.html'
	* `graphicEQ`: 'graphicEQTemplate.html'
		
Methods:

* `drawPlayer(containerSelector)`: Draws the default player template as a child in the element described by `containerSelector`
* `drawStandardTemplate(containerSelector, templateType)`: Draws a default template by template key `templateType` as a child in the element described by `containerSelector`

## Issues


## Browser support

<table width="100%" style="text-align: center;">
  <thead>
    <tr>
      <td>Safari</td>
      <td>Firefox</td>
      <td>Chrome</td>
      <td>&lt;=IE9</td>
      <td>IE10+</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>&#x2713;</td>
      <td>&#x2713;</td>
      <td>&#x2713;</td>
      <td>&#x2717;</td>
      <td>&#x2713;</td>
    </tr>
  </tbody>
</table>



## Build instructions

ChardPlayer is built using [grunt](http://gruntjs.com)

You'll need:

* Run `npm install` from the root directory.
* To run a build, you'll simply need to run `grunt`.
