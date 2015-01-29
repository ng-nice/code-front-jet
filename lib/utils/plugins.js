'use strict';

module.exports = {
  through: require('through2'),
  plumber: require('gulp-plumber'),
  sourcemaps: require('gulp-sourcemaps'),
  uglify: require('gulp-uglify'),
  minifyHtml: require('gulp-minify-html'),
  minifyCss: require('gulp-minify-css'),
  inject: require('gulp-inject'),
  imagemin: require('gulp-imagemin'),
  ngAnnotate: require('gulp-ng-annotate'),
  jshint: require('gulp-jshint'),
  sass: require('gulp-sass'),
  tsc: require('gulp-tsc'),
  coffee: require('gulp-coffee'),
  filter: require('gulp-filter'),
  rev: require('gulp-rev'),
  iconFont: require('gulp-iconfont'),
  iconFontCss: require('gulp-iconfont-css'),
  uglifySaveLicense: require('uglify-save-license'),
  runSequence: require('run-sequence'),
  mainBowerFiles: require('main-bower-files'),
  sort: require('sort-stream'),
  usemin: require('gulp-usemin'),
  wiredep: require('wiredep').stream
};