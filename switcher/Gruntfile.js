module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jslint: {
      client: {
        src: [
          '*.js'
        ],
        directives: {
          browser: true,
          predef: [
            'jQuery'
          ]
        },
      }
    },

    watch: {
      src: {
        files: ['*.js', '*.сss'],
        options: {
          livereload: true,
        },
      }
    }
  });

  // Default task(s).
 
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.registerTask('default', 'jslint');

};