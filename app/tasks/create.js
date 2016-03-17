'use strict';

var fs = require('fs');
var gulp = require('gulp');
var chalk = require('chalk');
var args = require('yargs').argv;
var sh = require('shelljs');

var log = require('../utils/log');
var env = require('../utils/env');

gulp.task('init', function () {
  var configTemplate = env.folders.frontJet + '/app/assets/app/fj.conf.js';

  if (!fs.existsSync(configTemplate)) {
    log.error("样本文件 [ " + configTemplate + ' ] 不存在，请重新安装front-jet!');
    return process.exit(1);
  }

  var configFile = env.folders.project + '/fj.conf.js';
  if (fs.existsSync(configFile)) {
    log.error("本项目已经初始化过，请先删除原有的fj.conf.js再重新初始化");
    return process.exit(1);
  }
  sh.cp(configTemplate, '.');
});

gulp.task('create', function () {
  var workDir = args.cwd;

  var projectName = args._[1];
  var seed = args._[2] || 'default';

  if (!projectName) {
    log.error("语法错误！用法：fj create 项目名称 [种子工程名，默认为default]");
    process.exit(1);
  }

  var projectFolder = workDir + '/' + projectName;

  if (fs.existsSync(projectFolder)) {
    log.error("目标目录已经存在，不能创建");
    process.exit(1);
  }

  var seedFolder = env.folders.frontJet + '/seeds/' + seed;

  if (!fs.existsSync(seedFolder)) {
    log.error("种子工程 [ " + seedFolder + ' ] 不存在，请指定有效的种子名');
    return;
  }

  sh.cp('-r', seedFolder + '/.', projectName);

  log.message(chalk.blue("=========项目初始化完毕！==========="));
  log.message(chalk.blue("请执行下列命令："));
  log.message(chalk.green("cd " + projectName + " # 进入项目目录"));
  log.message(chalk.green("fj serve # 启动开发服务器"));
});
