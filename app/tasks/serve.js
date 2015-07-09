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
var plugins = require('../utils/plugins');
var configure = require('../utils/configure');

var getRulesFor = function (config, url) {
  return _.filter(config.rules, function (rule) {
    if (_.isString(rule.url)) {
      // 如果是字符串，则只从开头位置匹配
      rule.url = new RegExp('^' + rule.url.replace(/\/$/, '') + '/(.*)$');
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
proxy.on('error', function (e, req, res) {
  res.writeHead(502, {
    'Content-Type': 'text/plain;charset=utf-8'
  });
  if (e.code === 'ECONNREFUSED') {
    res.end('网关错误！请检查反向代理对应的后端服务器是否启动成功。');
  } else {
    res.end('网关错误！未知原因，代码: ' + e.code);
  }
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
    req.url = req.url.replace(rule.url, rule.rewrite || '/$1');
    proxy.web(req, res, {target: rule.proxy});
  } else {
    next();
  }
}

function replaceByFork(url, forkName) {
  // 如果对应的文件存在，则转发
  if (url !== '/' && (fs.existsSync(env.folders.app + '/forks/' + forkName + url) || fs.existsSync(env.folders.temp + '/app/forks/' + forkName + url))) {
    return '/' + forkName + url;
  } else {
    return url;
  }
}
// 根据agent中的操作系统信息来判断应该把请求转给谁，特别适用于处理手机版特有的文件
function forkMiddleware(req, res, next) {
  var userAgent = req.headers['user-agent'];
  var ua = mobileAgent(userAgent);
  // 判断是否微信
  var isWeChat = /micromessenger/.test(userAgent);
  // 根据请求方的agent决定该重定向到谁
  if (isWeChat) {
    req.url = replaceByFork(req.url, 'wechat');
  } else if (ua.Android) {
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
  // 非GET请求不要管
  if (req.method !== 'GET') {
    return false;
  } else if (!headers || !headers.accept) {
    // 不带header或不带accept的不要管
    return false;
  } else if (headers.accept.indexOf('application/json') === 0) {
    // 请求json的不要管，这是api请求
    return false;
  } else if (!acceptsHtml(headers.accept)) {
    // 不接受text/html的不要管，这不是由浏览器直接发起的
    return false;
  }
  // templates.js不要管
  if (/\/templates.js$/.test(req.url)) {
    return false;
  }
  var parsedUrl = url.parse(req.url);
  // 已经存在的文件不要管
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
    port, function () {
      gulp.start('tdd');
    });
});

gulp.task('server', ['serve']);

gulp.task('preview.reload', function () {
  plugins.connect.reload();
});

var serveStatic = function (root, port) {
  port = port || env.ports.static;
  plugins.connect.server({
    root: root,
    port: port,
    livereload: true
  });
};
gulp.task('preview', function () {
  return serveStatic(env.folders.build);
});

gulp.task('web', function () {
  return serveStatic(process.cwd());
});

gulp.task('config', function () {
  configure(env.folders.project + '/fj.conf.js', env.config);
});
