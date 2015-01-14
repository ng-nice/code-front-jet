'use strict';

var args = require('yargs').argv;
var path = require('path');
var fs = require('fs');
var sh = require('shelljs');

var projectDir = process.cwd();
var projectName = path.basename(projectDir);
var buildDir = projectDir + '/dist';

var frontJetDir = args.fjHome;
var tempDir = projectDir + '/.tmp';
var appDir = projectDir + '/app';
var testDir = projectDir + '/test';
if (!fs.existsSync(buildDir))
  sh.mkdir('-p', buildDir);

var SERVER_PORT = 5000;

module.exports = {
  ports: {
    server: SERVER_PORT
  },
  args: args,

  config: {},

  folders: {
    frontJet: frontJetDir,
    project: projectDir,
    app: appDir,
    temp: tempDir,
    test: testDir,
    build: buildDir
  },
  name: projectName,
  targets: {
    android: args.android,
    ios: args.ios
  }
};