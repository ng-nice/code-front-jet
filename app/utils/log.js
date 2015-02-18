'use strict';

var chalk = require('chalk');
var gutil = require('gulp-util');
var Q = require('q');
var _ = require('underscore');
var notify = require('gulp-notify')({title: 'Front Jet Error Report'});
var args = require('yargs').argv;

var log = function (args) {
  var chalkIt = function (value) {
    return value
  };

  args = _.map(args, function (arg) {
    if (_.isFunction(arg)) {
      chalkIt = arg;
      return null;
    } else {
      if (_.isObject(arg)) {
        arg = JSON.stringify(arg);
      }
      return chalkIt(arg);
    }
  });
  args = _.compact(args);
  return console.log.apply(console, args);
};
module.exports = {
  debug: function () {
    if (args.debug || args.d) {
      return log([chalk.cyan].concat(_.toArray(arguments)));
    }
  },
  error: function () {
    notify.write.apply(notify, arguments);
    return log([chalk.red].concat(_.toArray(arguments)));
  },

  message: function () {
    return log([chalk.green].concat(_.toArray(arguments)));
  },
  info: function () {
    return log([chalk.cyan].concat(_.toArray(arguments)));
  },
  log: function () {
    return log.call(this, _.toArray(arguments));
  },
  prompt: function (msg) {
    var deferred = Q.defer();
    process.stdout.write(chalk.cyan(msg), "utf-8");
    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', function () {
      var chunk = process.stdin.read();

      if (chunk !== null) {
        process.stdin.end();
        deferred.resolve(chunk.trim());
      }
    });
    process.stdin.on('error', function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  }
};
