'use strict';
var fs = require('fs');
var gulp = require('gulp');
var env = require('../utils/env');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');


gulp.task('watch', ['compile'], function () {
  // 排除所有bower文件，以免监视过多
  var excludeBower = '!' + env.folders.library + '/**/*';
  // bower文件变化时重新安装并加载
  watch(env.folders.app + "/bower.json", function () {
    return runSequence('wireBower');
  });
  // 监控配置文件，修改时自动重新加载
  watch(env.folders.app + '/fj.conf.js', function () {
    return runSequence('config');
  });
  watch([env.folders.app + "/**/*.scss", excludeBower], function (file) {
    // 如果是删除文件则删除对应的css文件
    if (file.event === 'unlink') {
      fs.unlinkSync(env.folders.temp + '/app/' + file.relative.replace(/\.scss$/, '.css'));
    }
    return runSequence('sass', 'wireApp');
  });
  watch([env.folders.app + "/**/*.ts", excludeBower], function (file) {
    // 如果是删除文件则删除对应的js文件
    if (file.event === 'unlink') {
      fs.unlinkSync(env.folders.temp + '/app/' + file.relative.replace(/\.ts$/, '.js'));
    }
    return runSequence('typescript', 'wireApp');
  });
  watch([env.folders.app + "/**/*.coffee", excludeBower], function (file) {
    // 如果是删除文件则删除对应的js文件
    if (file.event === 'unlink') {
      fs.unlinkSync(env.folders.temp + '/app/' + file.relative.replace(/\.coffee$/, '.js'));
    }
    return runSequence('coffee', 'wireApp');
  });
  watch([env.folders.app + "/**/*.svg", excludeBower], function () {
    return runSequence('webFont');
  });
  watch([env.folders.app + "/**/*.js", env.folders.temp + '/app/**/*.js', excludeBower], function () {
    return runSequence('wireApp');
  });
});
