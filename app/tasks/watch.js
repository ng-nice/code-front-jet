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
    try {
      return runSequence('wireBower');
    } catch (e) {
      log.error(e);
    }
  });
  // 监控配置文件，修改时自动重新加载
  watch(env.folders.project + '/fj.conf.js', function (file) {
    try {
      return runSequence('config');
    } catch (e) {
      log.error(e);
    }
  });
  watch([env.folders.app + "/**/*.scss"], function (file) {
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
  watch(env.folders.app + "/**/*.ts", function (file) {
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
  watch(env.folders.test + "/**/*.ts", function (file) {
    try {
      // 如果是删除文件则删除对应的js文件
      if (file.event === 'unlink') {
        var fileName = env.folders.temp + '/test/' + file.relative.replace(/\.ts$/, '.js');
        if (fs.existsSync(fileName)) {
          fs.unlinkSync(fileName);
        }
      }
      return runSequence('typescript');
    } catch (e) {
      log.error(e);
    }
  });
  watch(env.folders.app + "/**/*.es6", function (file) {
    try {
      // 如果是删除文件则删除对应的js文件
      if (file.event === 'unlink') {
        var fileName = env.folders.temp + '/app/' + file.relative.replace(/\.es6$/, '.js');
        if (fs.existsSync(fileName)) {
          fs.unlinkSync(fileName);
        }
      }
      return runSequence('es6');
    } catch (e) {
      log.error(e);
    }
  });
  watch(env.folders.test + "/**/*.es6", function (file) {
    try {
      // 如果是删除文件则删除对应的js文件
      if (file.event === 'unlink') {
        var fileName = env.folders.temp + '/test/' + file.relative.replace(/\.es6$/, '.js');
        if (fs.existsSync(fileName)) {
          fs.unlinkSync(fileName);
        }
      }
      return runSequence('es6');
    } catch (e) {
      log.error(e);
    }
  });
  watch(env.folders.app + "/**/*.coffee", function (file) {
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
  watch(env.folders.test + "/**/*.coffee", function (file) {
    try {
      // 如果是删除文件则删除对应的js文件
      if (file.event === 'unlink') {
        var fileName = env.folders.temp + '/test/' + file.relative.replace(/\.coffee$/, '.js');
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
    try {
      return runSequence('webFont');
    } catch (e) {
      log.error(e);
    }
  });
  watch([env.folders.app + "/**/*.js", env.folders.temp + '/app/**/*.js'], function (file) {
    try {
      if (file.event === 'add' || file.event === 'unlink') {
        // 添加删除文件时自动重新启动
        return runSequence('wireAppJs', 'tddRestart');
      }
    } catch (e) {
      log.error(e);
    }
  });
  watch([env.folders.test + "/**/*.js", env.folders.temp + '/test/**/*.js'], function (file) {
    try {
      if (file.event === 'add' || file.event === 'unlink') {
        // 添加删除文件时自动重新启动
        return runSequence('tddRestart');
      }
    } catch (e) {
      log.error(e);
    }
  });
});
