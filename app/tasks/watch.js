'use strict';
var fs = require('fs');
var gulp = require('gulp');
var env = require('../utils/env');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var log = require('../utils/log');

gulp.task('watch', ['compile'], function () {
  // bower.json文件变化时重新安装并加载
  watch(env.folders.project + "/bower.json", function (file) {
    runSequence('wireBower');
  });
  // 监控配置文件，修改时自动重新加载
  watch(env.folders.project + '/fj.conf.js', function (file) {
    runSequence('config');
  });
  watch([env.folders.app + "/**/*.scss"], function (file) {
    // 如果是删除文件则删除对应的css文件
    if (file.event === 'unlink') {
      var fileName = env.folders.temp + '/app/' + file.relative.replace(/\.scss$/, '.css');
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    }
    // 添加删除文件时需要重新wireAppScss
    if (file.event === 'add' || file.event === 'unlink') {
      runSequence('wireAppScss', 'sass');
    } else {
      runSequence('sass');
    }
  });
  watch(env.folders.app + "/**/*.ts", function (file) {
    // 如果是删除文件则删除对应的js文件
    if (file.event === 'unlink') {
      var fileName = env.folders.temp + '/app/' + file.relative.replace(/\.ts$/, '.js');
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    }
    runSequence('typescript');
  });
  watch(env.folders.test + "/**/*.ts", function (file) {
    // 如果是删除文件则删除对应的js文件
    if (file.event === 'unlink') {
      var fileName = env.folders.temp + '/test/' + file.relative.replace(/\.ts$/, '.js');
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    }
    runSequence('typescript');
  });
  watch(env.folders.app + "/**/*.es6", function (file) {
    // 如果是删除文件则删除对应的js文件
    if (file.event === 'unlink') {
      var fileName = env.folders.temp + '/app/' + file.relative.replace(/\.es6$/, '.js');
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    }
    runSequence('es6');
  });
  watch(env.folders.test + "/**/*.es6", function (file) {
    // 如果是删除文件则删除对应的js文件
    if (file.event === 'unlink') {
      var fileName = env.folders.temp + '/test/' + file.relative.replace(/\.es6$/, '.js');
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    }
    runSequence('es6');
  });
  watch(env.folders.app + "/**/*.coffee", function (file) {
    // 如果是删除文件则删除对应的js文件
    if (file.event === 'unlink') {
      var fileName = env.folders.temp + '/app/' + file.relative.replace(/\.coffee$/, '.js');
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    }
    runSequence('coffee');
  });
  watch(env.folders.test + "/**/*.coffee", function (file) {
    // 如果是删除文件则删除对应的js文件
    if (file.event === 'unlink') {
      var fileName = env.folders.temp + '/test/' + file.relative.replace(/\.coffee$/, '.js');
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    }
    runSequence('coffee');
  });
  watch([env.folders.app + "/**/*.svg"], function (file) {
    runSequence('webFont');
  });
  watch([env.folders.app + "/**/*.js", env.folders.temp + '/app/**/*.js'], function (file) {
    if (file.event === 'add' || file.event === 'unlink') {
      // 添加删除文件时自动重新启动
      runSequence('wireAppJs', 'tddRestart');
    }
  });
  watch([env.folders.test + "/**/*.js", env.folders.temp + '/test/**/*.js'], function (file) {
    if (file.event === 'add' || file.event === 'unlink') {
      // 添加删除文件时自动重新启动
      runSequence('tddRestart');
    }
  });
});
