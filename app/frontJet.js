'use strict';
var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var gulpEvents = require('./utils/gulp-events');
var env = require('./utils/env');

var command = process.argv[2];
if (!command) {
  command = 'help';
}

var configFile = 'fj.conf.js';
if (!/^(help|create|init|web|debug)$/.test(command) && !fs.existsSync(configFile)) {
  console.log('项目中没有Fj所需的配置文件，请先运行fj init命令进行初始化');
  process.exit(-1);
}

process.env.PATH = [env.folders.frontJetModuleBin, process.env.PATH].join(path.delimiter);
process.env.NODE_PATH = [
  path.join(env.folders.frontJet, 'node_modules'),
  process.env.NODE_PATH
].join(path.delimiter);


gulpEvents(gulp);

require('./tasks/build');
require('./tasks/create');
require('./tasks/help');
require('./tasks/mock');
require('./tasks/serve');
require('./tasks/test');
require('./tasks/watch');

gulp.task('default', ['help']);

gulp.start(command);
