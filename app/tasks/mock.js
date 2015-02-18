'use strict';
var path = require('path');
var gulp = require('gulp');
var watch = require('gulp-watch');
var env = require('../utils/env');
var nodeMon = require('gulp-nodemon');

// 如果应用部分需要自己的node_modules，就加在mock目录下吧
gulp.task('mock', function () {
  nodeMon({
    script: env.folders.mock + '/server.js',
    ext: 'js json coffee',
    env: {
      NODE_ENV: 'development',
      NODE_PATH: [env.folders.mock + '/node_modules', env.folders.frontJet + '/node_modules', process.env.NODE_PATH].join(path.delimiter)
    },
    nodeArgs: ['--debug']
  });
});