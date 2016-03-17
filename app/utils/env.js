'use strict';

var args = require('yargs').argv;
var path = require('path');
var fs = require('fs');

var projectDir = process.cwd();
var projectName = path.basename(projectDir);
var buildDir = path.join(projectDir, 'dist');

var frontJetDir = path.dirname(path.dirname(__dirname));
var tempDir = path.join(projectDir, '.tmp');
var appDir = path.join(projectDir, 'app');
var libraryDir = path.join(projectDir, 'bower_components');
var mockDir = path.join(projectDir, 'mock');
var testDir = path.join(projectDir, 'test');

var SERVER_PORT = 5000;
var STATIC_PORT = 15000;

module.exports = {
  ports: {
    server: SERVER_PORT,
    static: STATIC_PORT
  },
  args: args,

  config: {},

  folders: {
    frontJet: frontJetDir,
    frontJetModuleBin: path.join(frontJetDir, 'node_modules', '.bin'),
    project: projectDir,
    app: appDir,
    library: libraryDir,
    temp: tempDir,
    test: testDir,
    build: buildDir,
    mock: mockDir
  },
  name: projectName,
  targets: {
    android: args.android,
    ios: args.ios
  },
  debug: args.d || args.debug
};
