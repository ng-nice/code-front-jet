'use strict';

var Q = require('q');
var log = require('./log');
var sh = require('shelljs');
var spawn = require('cross-spawn');

var Errors = {
  'not.exists': '可执行文件不存在',
  'exec.error': '文件执行出错'
};
var reportError = function (error) {
  log.error(Errors[error.code]);
  log.error('  命令：' + error.cmd);
  log.error('  参数：' + JSON.stringify(error.params));
  process.exit(1);
};

module.exports = function exec(cmd, params, cwd) {
  var deferred = Q.defer();
  if (!sh.which(cmd)) {
    var errorData = {code: 'not.exists', cmd: cmd, params: params};
    reportError(errorData);
    deferred.reject(errorData);
  } else {
    var child = spawn(cmd, params, {cwd: cwd, stdio: [process.stdin, process.stdout, process.stderr]});
    child.on('error', function (err) {
      reportError({code: 'exec.error', cmd: cmd, params: params});
    });
    child.on('close', function (code) {
      if (code) {
        deferred.reject(code);
      } else {
        deferred.resolve(code);
      }
    });
  }
  return deferred.promise;
};
