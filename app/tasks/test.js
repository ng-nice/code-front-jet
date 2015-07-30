'use strict';

var fs = require('fs');

var gulp = require('gulp');
var wiredep = require('wiredep');
var _ = require('lodash');

var env = require('../utils/env');
var log = require('../utils/log');
var plugins = require('../utils/plugins');

var getTestFiles = function () {
  // 添加所有bower文件
  var bowerDeps = [];
  if (fs.existsSync(env.folders.library)) {
    bowerDeps = wiredep({
      directory: env.folders.library,
      dependencies: true,
      devDependencies: true
    }).js;
  }
  var bowerFiles = gulp.src(bowerDeps, {read: false});

  var filter = '/**/*.js';
  // 添加app目录中除了bower之外的所有文件
  var appFiles = gulp.src([env.folders.app + filter, env.folders.app + '/**/*.test.js', '!' + env.folders.library + filter], {base: env.folders.app});
  // 添加临时目录下的文件，这些通常是coffee等文件的编译结果
  var tmpFiles = gulp.src([env.folders.temp + '/app' + filter, '!' + env.folders.temp + '/app/bower_components' + filter], {base: env.folders.temp + '/app'});
  // 按照angular依赖关系排序
  var sortedFiles = plugins.merge(appFiles, tmpFiles)
    .pipe(plugins.angularFileSort());

  var htmlFiles = gulp.src([env.folders.app + '/**/*.html', '!' + env.folders.library + '/**/*.html'], {base: env.folders.app});
  var testFiles = gulp.src([env.folders.test + '/unit/**/*.js', env.folders.temp + '/test/unit/**/*.js'], {read: false});
  return plugins.merge(bowerFiles, sortedFiles, htmlFiles, testFiles);
};
var karmaOptions = function (action) {
  return _.extend({
    basePath: env.folders.project,
    configFile: env.folders.test + '/karma.conf.js',
    frameworks: ['jasmine'],

    browsers: ['PhantomJS'],
    preprocessors: {
      '**/*.html': ['ng-html2js']
    },
    ngHtml2JsPreprocessor: {
      stripPrefix: 'app/',
      moduleName: env.config.name || 'app'
    },
    plugins: [
      'karma-phantomjs-launcher',
      'karma-ng-html2js-preprocessor',
      'karma-jasmine'
    ]
  }, {action: action});
};

gulp.task('ut', function () {
  return getTestFiles()
    .pipe(plugins.plumber())
    .pipe(plugins.karma(karmaOptions('run')))
    .on('error', function () {
      log.error('Unit test Failed!');
      // Make sure failed tests cause gulp to exit non-zero
      process.exit(-1);
    });
});

var karmaProcess;
gulp.task('tdd', function () {
  getTestFiles()
    .pipe(plugins.plumber())
    .pipe(plugins.karma(karmaOptions('watch')))
    .on('error', function () {
      // Make sure failed tests cause gulp to exit non-zero
      log.error('Unit test Failed!')
    })
    .on('complete', function (process) {
      karmaProcess = process;
    });
});
gulp.task('tddRestart', function () {
  karmaProcess.kill();
  plugins.runSequence('tdd');
});

gulp.task('e2e-install', function(done) {
  plugins.protractor.webdriver_update(done);
});
gulp.task('e2e', ['e2e-install'], function (done) {
  var testFiles = [
    env.folders.test + '/e2e/**/*.js',
    '!' + env.folders.test + '/e2e/pages/**/*.js'
  ];

  gulp.src(testFiles)
    .pipe(plugins.plumber())
    .pipe(plugins.protractor.protractor({
      multiCapabilities: [
        {
          'browserName': 'phantomjs'
        },
        {
          'browserName': 'chrome'
        },
        {
          'browserName': 'firefox'
        },
        {
          'browserName': 'ie'
        }
      ],
      specs: ['test/e2e/**/*.js'],
      jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
      },
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
  plugins.runSequence('ut', 'e2e', done)
});
