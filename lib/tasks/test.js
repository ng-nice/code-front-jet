'use strict';

var fs = require('fs');

var gulp = require('gulp');
var wiredep = require('wiredep');
var karma = require('gulp-karma');
var protractor = require('gulp-protractor');

var env = require('../utils/env');
var log = require('../utils/log');
var plugin = require('../utils/plugins');

var getTestFiles = function () {
  // 添加所有bower文件
  var bowerDeps = [];
  if (fs.existsSync(env.folders.library)) {
    bowerDeps = wiredep({
      directory: env.folders.library,
      dependencies: true,
      devDependencies: false
    }).js;
  }
  var bowerFiles = gulp.src(bowerDeps);

  var filter = '/**/*.js';
  // 添加app目录中除了bower之外的所有文件
  var appFiles = gulp.src([env.folders.app + filter, '!' + env.folders.library + filter], {base: env.folders.app});
  // 添加临时目录下的文件
  var tmpFiles = gulp.src(env.folders.temp + '/app' + filter, {base: env.folders.temp + '/app'});
  // 按照angular依赖关系排序
  var sortedFiles = plugin.merge(appFiles, tmpFiles)
    .pipe(plugin.angularFileSort())
    // merge不能确保两个流中文件的顺序，所以稍微延迟一下，以确保bower的文件排在app文件的前面。
    .pipe(plugin.wait(300));

  return plugin.merge(bowerFiles, sortedFiles);
};
gulp.task('ut', ['compile'], function () {
  return getTestFiles()
    .on('data', function (file) {
      console.log(file.path)
    })
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
