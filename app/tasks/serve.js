'use strict';

var gulp = require('gulp');
var fs = require('fs');
var url = require('url');
var path = require('path');

var _ = require('lodash');

var browserSync = require('browser-sync');
var httpProxy = require('http-proxy');
var mobileAgent = require('mobile-agent');

var env = require('../utils/env');
var log = require('../utils/log');

var getRulesFor = function (config, url) {
  return _.filter(config.rules, function (rule) {
    if (_.isString(rule.url)) {
      // 如果是字符串，则只从开头位置匹配
      rule.url = new RegExp('^' + rule.url + '/(.*)$');
    }
    return rule.url.test(url);
  });
};
var cascadeRules = function (rules) {
  var result = {};
  // 把规则逐层叠加起来
  _.each(rules, function (rule) {
    _.extend(result, rule);
  });
  return result;
};

function delayMiddleware(req, res, next) {
  var rules = getRulesFor(env.config, req.url);
  var rule = cascadeRules(rules);
  if (rule.delay) {
    log.debug('[delay]', rule.delay + 'ms for ' + req.url);
    setTimeout(function () {
      next();
    }, rule.delay);
  } else {
    next();
  }
}

var proxy = httpProxy.createProxyServer({
  changeOrigin: true
});
// TODO: 当目标服务器不存在时，不应该返回pending
proxy.on('error', function (e) {
  console.error('proxy: ', e);
  proxy.close();
});
function proxyMiddleware(req, res, next) {
  var rules = getRulesFor(env.config, req.url);
  // 代理的规则不需要层叠
  var rule = _.find(rules.reverse(), function (rule) {
    return rule.proxy;
  });
  // 反向代理
  if (rule && rule.proxy) {
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
    log.debug('[proxy]', req.url, ' => ', rule.proxy);
    req.url = req.url.replace(rule.url, rule.rewrite || '/$1');
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
    req.url = replaceByFork(req.url, 'default');
  }
  next();
}

var baseDirs = [
  '.',
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
  // templates.js不要管
  if (req.url.endsWith('/templates.js')) {
    return false;
  }
  var parsedUrl = url.parse(req.url);
  var isInternal = _.any(baseDirs, function (dir) {
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

function browserSyncInit(baseDir, files, port, success, browser) {
  browser = browser === undefined ? 'default' : browser;

  return browserSync({
    ui: {
      port: port,
      weinre: {
        port: 9090
      }
    },
    routes: {
      "/bower_components": env.folders.library
    },
    files: files,
    ghostMode: !!env.args.clone, // 默认禁止操作克隆功能，在开发阶段，同步操作带来的困扰大于收益
    https: env.args.s || env.args.https,
    startPath: '/index.html',
    logPrefix: 'FJ',
    server: {
      baseDir: baseDir,
      // 用户自定义的middleware优先。fork必须在historyApi前面，以便对fork处理后再判断是否存在
      middleware: (env.config.middlewares || []).concat([delayMiddleware, proxyMiddleware, forkMiddleware, historyApiMiddleware])
    },
    browser: browser,
    port: port,
    open: 'ui'
  }, success);
}

gulp.task('reload', function () {
  browserSync.reload();
});

gulp.task('serve', ['config', 'watch'], function () {
  var port = +(env.args.port || env.args.p) || env.ports.server;
  browserSyncInit(
    baseDirs,
    [
      '.tmp/app/**/*.css',
      '.tmp/app/**/*.js',
      'app/**/*.html',
      'app/**/*.htm',
      'app/**/*.css',
      'app/**/*.js',
      'app/images/**/*',
      'app/fonts/**/*'
    ],
    port, function() {
      gulp.start('tdd');
    });
});

gulp.task('server', ['serve']);

gulp.task('config', function () {
  var conf = require(env.folders.project + '/fj.conf.js');
  env.config = {};
  conf(env.config);
});
