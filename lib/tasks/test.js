'use strict';

var fs = require('fs');

var gulp = require('gulp');
var wiredep = require('wiredep');
var karma = require('gulp-karma');
var protractor = require('gulp-protractor');

var env = require('../utils/env');
var log = require('../utils/log');

var getTestFiles = function () {
  var testFiles = [
    env.folders.app + '/scripts/**/*.js',
    env.folders.test + '/unit/**/*.js'
  ];

  var bowerDeps = [];
  if (fs.existsSync(env.folders.app + '/bower_components')) {
    bowerDeps = wiredep({
      directory: env.folders.app + '/bower_components',
      exclude: ['bootstrap-sass-official'],
      dependencies: true,
      devDependencies: true
    }).js;
  }
  return bowerDeps.concat(testFiles);
};
gulp.task('ut', function () {
  return gulp.src(getTestFiles())
    .pipe(karma({
      configFile: env.folders.test + '/karma.conf.js',
      action: 'run'
    }))
    .on('error', function () {
      // Make sure failed tests cause gulp to exit non-zero
      log.error("Unit test Failed!")
    });
});

gulp.task('tdd', ['serve'], function () {
  return gulp.src(getTestFiles())
    .pipe(karma({
      configFile: env.folders.test + '/karma.conf.js',
      action: 'watch'
    }))
    .on('error', function () {
      // Make sure failed tests cause gulp to exit non-zero
      log.error("Unit test Failed!")
    });
});

gulp.task('e2e', function (done) {
  var testFiles = [
    env.folders.test + '/e2e/**/*.js'
  ];

  gulp.src(testFiles)
    .pipe(protractor.protractor({
      configFile: 'test/protractor.conf.js'
    }))
    .on('error', function (err) {
      log.error("端到端测试运行失败");
      process.exit(1);
    })
    .on('end', function () {
      done();
      process.exit();
    });
});

gulp.task('test', function (done) {
  runSequence('ut', 'e2e', done)
});
