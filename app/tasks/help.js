'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var chalk = require('chalk');
var showHelp = require('../utils/help');

gulp.task('help', function () {
  gutil.log(chalk.cyan("\n—— 服务管理 ——"));
  showHelp("fj serve [--port $PORT] [--https|-s] [--clone]", "利用浏览器进行开发，每个修改都会实时反馈到页面上。$PORT指定监听端口，默认为5000。如果指定了https，则使用https提供服务。如果指定了clone，则访问此服务的各个浏览器页面之间会进行操作克隆");

  gutil.log(chalk.cyan("\n—— 自动化测试 ——"));
  showHelp("fj ut", "执行单元测试。");
  showHelp("fj tdd", "进行测试驱动开发。当用户修改任何js文件时，单元测试都会自动重新执行一遍。");
  showHelp("fj e2e", "执行端到端测试，模拟用户操作。");
  showHelp("fj test", "执行单元测试，然后执行端到端测试");

  gutil.log(chalk.cyan("\n—— 构建 ——"));
  showHelp("fj build [--$OS] [--ci]", '把应用构建到dist目录下，原有内容会被清空。如果指定了os参数，则只构建相应分支；否则直接构建forks目录，您自己的Web服务程序可以对客户端系统进行判断并转到相应目录。如果指定了ci参数，则禁用bower的交互模式');

  gutil.log(chalk.cyan("\n—— 简要说明 ——"));
  showHelp("关于帮助的简要说明", '"[ ]" 表示可选参数。 "$NAME"等表示需要您自己指定的名称、路径等');
});
