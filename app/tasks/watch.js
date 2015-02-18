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
    log.debug(file.relative + '已更改');
    try {
      return runSequence('wireBower');
    } catch (e) {
      log.error(e);
    }
  });
  // 监控配置文件，修改时自动重新加载
  watch(env.folders.project + '/fj.conf.js', function (file) {
    log.debug(file.relative + '已更改');
    try {
      return runSequence('config');
    } catch (e) {
      log.error(e);
    }
  });
  watch([env.folders.app + "/**/*.scss"], function (file) {
    log.debug(file.relative + '已更改');
    // 如果是删除文件则删除对应的css文件
    try {
      if (file.event === 'unlink') {
        var fileName = env.folders.temp + '/app/' + file.relative.replace(/\.scss$/, '.css');
        if (fs.existsSync(fileName)) {
          fs.unlinkSync(fileName);
        }
      }
      // 添加删除文件时需要重新wireAppScss
      if (file.event === 'add' || file.event === 'unlink') {
        return runSequence('wireAppScss', 'sass');
      } else {
        return runSequence('sass');
      }
    } catch (e) {
      log.error(e);
    }
  });
  watch([env.folders.app + "/**/*.ts"], function (file) {
    log.debug(file.relative + '已更改');
    try {
      // 如果是删除文件则删除对应的js文件
      if (file.event === 'unlink') {
        var fileName = env.folders.temp + '/app/' + file.relative.replace(/\.ts$/, '.js');
        if (fs.existsSync(fileName)) {
          fs.unlinkSync(fileName);
        }
      }
      return runSequence('typescript');
    } catch (e) {
      log.error(e);
    }
  });
  watch([env.folders.app + "/**/*.coffee"], function (file) {
    log.debug(file.relative + '已更改');
    try {
      // 如果是删除文件则删除对应的js文件
      if (file.event === 'unlink') {
        var fileName = env.folders.temp + '/app/' + file.relative.replace(/\.coffee$/, '.js');
        if (fs.existsSync(fileName)) {
          fs.unlinkSync(fileName);
        }
      }
      return runSequence('coffee');
    } catch (e) {
      log.error(e);
    }
  });
  watch([env.folders.app + "/**/*.svg"], function (file) {
    log.debug(file.relative + '已更改');
    try {
      return runSequence('webFont');
    } catch (e) {
      log.error(e);
    }
  });
  watch([env.folders.app + "/**/*.js", env.folders.temp + '/app/**/*.js'], function (file) {
    log.debug(file.relative + '已更改');
    try {
      if (file.event === 'add' || file.event === 'unlink') {
        return runSequence('wireAppJs');
      }
    } catch (e) {
      log.error(e);
    }
  });
});
