'use strict';
var gulp = require('gulp');
var env = require('../utils/env');

gulp.task('watch', ['compile'], function () {
  gulp.watch("bower.json", ['wireBower']);
  gulp.watch(env.folders.app + '/**/*.scss', ['sass']);
  gulp.watch(env.folders.app + '/images/**/*.svg', ['webFont']);
  gulp.watch(env.folders.app + '/**/*.js', ['wireApp']);
  gulp.watch(env.folders.app + '/**/*.ts', ['typescript']);
  gulp.watch(env.folders.app + '/**/*.coffee', ['coffee']);
  // 监控配置文件，修改时自动重新加载
  gulp.watch(env.folders.app + '/fj.conf.js', ['config']);
});
