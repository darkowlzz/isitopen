module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({

    jshint: {
      options: {
        eqeqeq: true,
        jshintrc: true
      },
      all: ['src/**/*.js']
    },

    watch: {
      jshint: {
        tasks: ['jshint:all'],
        files: ['src/**/*.js']
      }
    },

    mochaTest: {
      test: {
        options: {
          require: 'should',
          reporter: 'spec',
          ui: 'bdd',
          recursive: true
        },
        src: ['src/test/**/*.js']
      }
    }
  });

  grunt.registerTask('default', ['jshint:all', 'watch']);
  grunt.registerTask('test', ['jshint', 'mochaTest']);
};
