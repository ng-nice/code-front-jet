'use strict';

var gulp = require('gulp');
var fs = require('fs');
var url = require('url');

var _ = require('underscore');

var browserSync = require('browser-sync');
var httpProxy = require('http-proxy');
var mobileAgent = require('mobile-agent');

var env = require('../utils/env');

var getRuleFor = function (config, url) {
  var result = {};
  _.each(config.rules, function (rule) {
    if (_.isString(rule.url)) {
      // 如果是字符串，则只从开头位置匹配
      rule.url = new RegExp('^' + rule.url);
    }
    if (rule.url.test(url)) {
      _.extend(result, rule);
    }
  });
  return result
};

function delayMiddleware(req, res, next) {
  var config = env.config;
  var rule = getRuleFor(config, req.url);
  if (rule.delay) {
    console.log('delay ' + rule.delay + 'ms for ' + req.url);
    setTimeout(function () {
      next();
    }, rule.delay);
  } else {
    next();
  }
}

function rewriteMiddleware(req, res, next) {
  var config = env.config;
  var rule = getRuleFor(config, req.url);
  // url重写
  if (rule.rewrite) {
    req.url = req.url.replace(rule.url, rule.rewrite);
  }
  next();
}

var proxy = httpProxy.createProxyServer({
  hostRewrite: true,
  changeOrigin: true
});
proxy.on('error', function (e) {
  console.error('proxy: ', e);
});

function proxyMiddleware(req, res, next) {
  var config = env.config;
  var rule = getRuleFor(config, req.url);
  // 反向代理
  if (rule.proxy) {
    // path和domain使用对方的
    var proxyParts = url.parse(rule.proxy);
    rule.cookie.path = rule.cookie.path || proxyParts.pathname.replace('/(.*?)/.*', '/$1');
    rule.cookie.domain = rule.cookie.domain || proxyParts.host;

    res.oldSetHeader = res.setHeader;
    res.setHeader = function (name, value) {
      // patch set-cookie/path, set-cookie/domain
      if (name.toLowerCase() === 'set-cookie') {
        value = _.map(value, function (cookie) {
          cookie = cookie.replace(/path=\/(.*?)(;|$)/gi, 'path=' + rule.cookie.path + ';');
          cookie = cookie.replace(/domain=\/(.*?)(;|$)/gi, 'domain=' + rule.cookie.domain + ';');
          return cookie;
        });
      }
      res.oldSetHeader(name, value);
    };
    proxy.web(req, res, {target: rule.proxy});
  } else {
    next();
  }
}

function replaceByFork(url, forkName) {
  // 如果对应的文件存在，则转发
  if (url !== '/' && fs.existsSync(env.folders.app + '/forks/' + forkName + url)) {
    return '/' + forkName + url;
  } else {
    return url;
  }
}
// 根据agent中的操作系统信息来判断应该把请求转给谁，特别适用于处理手机版特有的文件
function forkMiddleware(req, res, next) {
  var ua = mobileAgent(req.headers['user-agent']);
  // 根据请求方的agent决定该重定向到谁
  if (ua.Android) {
    req.url = replaceByFork(req.url, 'android');
  } else if (ua.iOS || ua.iPhone) {
    req.url = replaceByFork(req.url, 'ios');
  } else {
    req.url = replaceByFork(req.url, 'others');
  }
  next();
}

var baseDirs = [
  'app',
  '.tmp/app'
];
// 是否由html5 history api生成的虚拟url
var isVirtualUrl = function (req) {
  function acceptsHtml(header) {
    return header.indexOf('text/html') !== -1 || header.indexOf('*/*') !== -1;
  }

  var headers = req.headers;
  // Not rewriting if the method is not GET.',
  if (req.method !== 'GET') {
    return false;
  } else if (!headers || typeof headers.accept !== 'string') {
    // Not rewriting if the client did not send an HTTP accept header
    return false;
  } else if (headers.accept.indexOf('application/json') === 0) {
    // Not rewriting if the client prefers JSON
    return false;
  } else if (!acceptsHtml(headers.accept)) {
    // Not rewriting if the client does not accept HTML
    return false;
  }
  var parsedUrl = url.parse(req.url);
  var isInternal = _.any(baseDirs, function(dir) {
    return fs.existsSync(path.join(dir, parsedUrl.pathname));
  });
  return !isInternal;
};
// rewrite from connect-history-api-fallback, I don't want to ignore all url's that contains '.'
function historyApiMiddleware(req, res, next) {
  if (isVirtualUrl(req)) {
    req.url = '/index.html'
  }
  next();
}

function browserSyncInit(baseDir, files, port, browser) {
  browser = browser === undefined ? 'default' : browser;

  browserSync({
    files: files,
    ghostMode: env.args.clone, // 默认禁止操作克隆功能，在开发阶段，同步操作带来的困扰大于收益
    https: env.args.s || env.args.https,
    startPath: '/index.html',
    server: {
      baseDir: baseDir,
      // 用户自定义的middleware优先。fork必须在historyApi前面，以便对fork处理后再判断是否存在
      middleware: (env.config.middlewares || []).concat([delayMiddleware, rewriteMiddleware, proxyMiddleware,
        forkMiddleware, historyApiMiddleware])
    },
    browser: browser,
    port: port,
    open: false
  });
}

gulp.task('serve', ['watch'], function () {
  var port = +(env.args.port || env.args.p) || env.ports.server;
  browserSyncInit(
    baseDirs,
    [
      '.tmp/app/**/*.css',
      'app/*.html',
      'app/**/*.css',
      'app/**/*.js',
      'app/images/**/*',
      'app/fonts/**/*'
    ],
    port);
});

gulp.task('server', ['serve']);

gulp.task('config', function () {
  var conf = require(env.folders.project + '/fj.conf.js');
  conf(env.config);
});