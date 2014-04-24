/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	
    clean: {
		all: ['dist/*.js', 'dist/*.css', '**/*.prefixed*.css', '**/*.min.css'],
		mincat: ['css/**/*.prefixed*.css', 'css/**/*.min.css']
	},
	watch: {
      files: ['js/**/*.js', 'css/**/*.css', '!**/*prefixed.css', '!*.min.css'],
      tasks: ['default']
    },
    autoprefixer: {
      build: {
        options: {
          browsers: ['last 2 versions', '> 1%']
        },
        files: [
          {
            src : ['css/**/*.css', '!**/*prefixed.css'],
            cwd : '',
            dest : '',
            ext : '.prefixed.css',
            expand : true
          }
        ]
      }
    },
    cssmin: {
	  minify: {
		expand: true,
		cwd: '',
		src: ['css/**/*.prefixed.css', '!*.min.css'],
		dest: '',
		ext: '.min.css'
	  }
    },
	uglify: {
	    core: {
			'dist/chardPlayer.min.js': ['ChardPlayer/chardPlayer.js']
		},
		ui: {
		  files: {
			'dist/chardPlayer.min.js': ['js/chardPlayer.js', 'js/ChardPlayerUI.js']
		  }
		}
	},
	concat: {
		css: {
			src: ['css/*.min.css'],
			dest: 'dist/chardPlayerUI.min.css',
		}
	}
  });

  // Default task.
  grunt.registerTask('default', ['clean:all', 'autoprefixer', 'cssmin', 'uglify:ui', 'concat', 'clean:mincat']);
  
  // Just core JS, no UI
  grunt.registerTask('core', ['clean', 'uglify:core']);

  // Use for development
  grunt.registerTask('dev', ['watch']);

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
};