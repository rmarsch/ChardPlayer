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
