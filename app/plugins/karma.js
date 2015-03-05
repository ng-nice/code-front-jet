/*jshint node:true */

'use strict';

// rewrite from gulp-karma

var gutil = require('gulp-util');
var c = gutil.colors;
var es = require('event-stream');
var extend = require('xtend');
var path = require('path');
var spawn = require('child_process').spawn;

var server = require('karma').server;
var env = require('../utils/env');

var karmaPlugin = function(options) {
  var stream;
  var process;
  var files = [];

  options = extend({
    action: 'run'
  }, options);

  var action = options.action;

  // Remove option in case Karma uses it in the future
  delete options.action;

  if (action === 'watch') {
    // Never set singleRun in background mode
    options.singleRun = false;

    // Enable watching
    options.autoWatch = true;
  }
  else if (action === 'run') {
    // Tell Karma to run once and exit
    options.singleRun = true;

    // Disable watching
    options.autoWatch = false;
  }

  if (options.configFile) {
    options.configFile = path.resolve(options.configFile);
  }

  function done(code) {
    // Stop the server if it's running
    if (process) {
      process.kill();
    }

    // End the stream if it exists
    if (stream) {
      if (code) {
        stream.emit('error', new gutil.PluginError('gulp-karma', 'karma exited with code ' + code));
      }
      else {
        stream.emit('end');
      }
    }
  }

  function startKarmaServer() {
    gutil.log('Starting Karma server...');

    // Start the server
    process = spawn(
      'node',
      [
        env.folders.frontJet + '/app/plugins/karma-cli.js',
        JSON.stringify(options)
      ],
      {
        stdio: 'inherit'
      }
    );

    // Cleanup when the child process exits
    process.on('exit', function(code) {
      // gutil.log('Karma child process ended');
      done(code);
    });
    stream.emit('complete', process);
  }

  function queueFile(file) {
    if (file) {
      // gutil.log('Queueing file '+file.path);
      files.push(file.path);
    }
    else {
      stream.emit('error', new Error('Got undefined file'));
    }
  }

  function endStream() {
    // Override files if they were piped
    // This doesn't work with the runner, but works fine with singleRun and autoWatch
    if (files.length) {
      options.files = files;
    }

    // Start the server
    // If options.singleRun: Server starts, tests run, task completes
    // If options.background: Server starts, tests run, files watched
    startKarmaServer();
  }

  stream = es.through(queueFile, endStream);

  return stream;
};

module.exports = karmaPlugin;
