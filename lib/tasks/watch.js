'use strict';
var gulp = require('gulp');
var env = require('../utils/env');

gulp.task('watch', ['compile'], function () {
  // 排除所有bower文件，以免监视过多
  var excludeBower = '!' + env.folders.library + '/**/*';
  gulp.watch("bower.json", ['wireBower']);
  gulp.watch([env.folders.app + '/**/*.scss', excludeBower], ['sass']);
  gulp.watch(env.folders.app + '/icons/**/*.svg', ['webFont']);
  gulp.watch([env.folders.app + '/**/*.js', env.folders.temp + '/app/**/*.js', excludeBower], ['wireApp']);
  gulp.watch([env.folders.app + '/**/*.ts', excludeBower], ['typescript']);
  gulp.watch([env.folders.app + '/**/*.coffee', excludeBower], ['coffee']);
  // 监控配置文件，修改时自动重新加载
  gulp.watch(env.folders.app + '/fj.conf.js', ['config']);
});
