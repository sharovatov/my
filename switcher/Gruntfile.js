module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jslint: {
      client: {
        src: [
          '*.js'
        ],
        exclude: [
          'Gruntfile.js'
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
        files: ['*.js', '*.css', '*.html'],
        options: {
          livereload: true,
        },
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.registerTask('default', 'jslint');

};