'use strict';

var chalk = require('chalk');
var gutil = require('gulp-util');
var prettyTime = require('pretty-hrtime');
function formatError(e) {
  if (!e.err) {
    return e.message;
  }

  // PluginError
  if (typeof e.err.showStack === 'boolean') {
    return e.err.toString();
  }

  // Normal error
  if (e.err.stack) {
    return e.err.stack;
  }

  // Unknown (string, number, etc.)
  return new Error(String(e.err)).stack;
}

module.exports = function (gulp) {
// Total hack due to poor error management in orchestrator
  gulp.on('err', function() {
    process.exit(-1);
  });

  gulp.on('task_start', function(e) {
    // TODO: batch these
    // so when 5 tasks start at once it only logs one time with all 5
    gutil.log('Starting', '\'' + chalk.cyan(e.task) + '\'...');
  });

  gulp.on('task_stop', function(e) {
    var time = prettyTime(e.hrDuration);
    gutil.log(
        'Finished', '\'' + chalk.cyan(e.task) + '\'',
        'after', chalk.magenta(time)
    );
  });

  gulp.on('task_err', function(e) {
    var msg = formatError(e);
    var time = prettyTime(e.hrDuration);
    gutil.log(
        '\'' + chalk.cyan(e.task) + '\'',
        chalk.red('errored after'),
        chalk.magenta(time)
    );
    gutil.log(msg);
  });

  gulp.on('task_not_found', function(err) {
    gutil.log(
        chalk.red('Task \'' + err.task + '\' is not in your gulpfile')
    );
    gutil.log('Please check the documentation for proper gulpfile formatting');
    process.exit(1);
  });
};