module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    jshint: {
      files: ['app/scripts/*.js'],
      options: {
        unused: true,
        strict: true,
        browser: true,
        bitwise: true,
        curly: true,
        eqeqeq: true,
        futurehostile: true,
        latedef: true,
        nonew: true,
        undef: true,
        globals: {
          console: true
        }
      }
    },
    jscs: {
      src: "app/scripts/*.js",
      options: {
        config: ".jscsrc",
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'jscs']
    },
    connect: {
      server: {
        options: {
          base: 'app',
          keepalive: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-jscs");
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('serve', ['connect:server']);

  //grunt.task.run('connect:server');
};
