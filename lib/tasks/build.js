'use strict';

var gulp = require('gulp');
var path = require('path');
var fs = require('fs');

var sh = require('shelljs');
var exec = require('../utils/exec');
var _ = require('underscore');

var through = require('through2');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license']
});

var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var inject = require('gulp-inject');
var imagemin = require('gulp-imagemin');
var ngAnnotate = require('gulp-ng-annotate');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var tsc = require('gulp-tsc');
var coffee = require('gulp-coffee');
var filter = require('gulp-filter');
var rev = require('gulp-rev');
var iconFont = require('gulp-iconfont');
var iconFontCss = require('gulp-iconfont-css');

var runSequence = require('run-sequence');
var mainBowerFiles = require('main-bower-files');
var plumber = require('gulp-plumber');
var sort = require('sort-stream');
var usemin = require('gulp-usemin');


var log = require('../utils/log');
var env = require('../utils/env');
var wiredep = require('wiredep').stream;


gulp.task('clean', function () {
  sh.rm('-fr', path.join(env.folders.build, '*'));
  sh.rm('-fr', path.join(env.folders.temp, '*'));
});

gulp.task('bowerInstall', function () {
  // 这里配置为interactive=false，以免扰乱CI系统
  return exec('bower', ['install', '--config.interactive=false', '--allow-root']).catch(function () {
    log.error("bower install失败，可能存在版本冲突，请手动运行bower install命令来解决它。");
    process.exit(1);
  });
});

gulp.task('sass', function () {
  return gulp.src(env.folders.app + '/styles/**/*.scss')
    // 解决windows下的gulp-sass bug：https://github.com/dlmanning/gulp-sass/issues/28
    .on('data', function (file) {
      if (process.platform === 'win32') {
        file.path = path.relative('.', file.path);
        file.path = file.path.replace(/\\/g, '/');
      }
    })
    .pipe(plumber())
    .pipe(sass({
      errLogToConsole: false,
      sourceComments: 'map',
      includePaths: [
        env.folders.app
      ],
      imagePath: env.folders.app + '/images',
      onError: function (error) {
        log.error(error);
      }
    }))
    .pipe(gulp.dest(env.folders.temp));
});

gulp.task('coffee', function () {
  return gulp.src(env.folders.app + '/scripts/**/*.coffee')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(coffee({bare: true})).on('error', log.error)
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(env.folders.temp));
});
gulp.task('typescript', function () {
  return gulp.src(env.folders.app + '/scripts/**/*.ts')
    .pipe(plumber())
    .pipe(tsc({sourcemap: true, declaration: true, emitError: false}))
    .pipe(gulp.dest(env.folders.temp));
});

gulp.task('lint', function () {
  // 第三方库的js不进行lint
  return gulp.src(['app/**/*.js', '!app/bower_components/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('webFont', function () {
  var fontName = 'app-icons';
  return gulp.src(env.folders.app + '/images/**/*.svg')
    .pipe(iconFontCss({
      fontName: fontName,
      path: env.folders.frontJet + '/node_modules/gulp-iconfont-css/templates/_icons.scss',
      targetPath: '_icons.scss',
      fontPath: './fonts/'
    }))
    .pipe(iconFont({
      fontName: fontName, // required
      normalize: true
    }))
    .pipe(gulp.dest(env.folders.temp + '/fonts/'))
    .on('end', function () {
      sh.mv('-f', env.folders.temp + '/fonts/_icons.scss', env.folders.app + '/styles/');
    });
});

gulp.task('css', function () {
  return gulp.src(env.folders.temp + '/**/*.css')
    .pipe(minifyCss())
    // 把所有文件放到根下，以便ide中的文件引用路径和css中一致
    .pipe(gulp.dest(env.folders.build));
});

gulp.task('wireBower', ['bowerInstall'], function () {
  return gulp.src(env.folders.app + '/*.html')
    .pipe(wiredep({
      directory: env.folders.app + '/bower_components',
      exclude: [],
      fileTypes: {
        html: {
          replace: {
            js: '<script src="{{filePath}}" charset="utf-8"></script>'
          }
        }
      }
    }))
    .pipe(gulp.dest('app'));
});
gulp.task('wireApp', function () {
  // 按照约定优于配置的原则将js文件注入所有根目录下的文件
  // TODO: 删除唯一的一个文件时没有自动删除引用，因为里面的数据源就没有，解决它。
  var injectJs = function (path, id) {
    // 总是对文件排序，以免随机的文件顺序导致index.html出现很多版本，干扰版本管理
    var sortedFiles = gulp.src(path, {read: false})
      .pipe(sort(function (a, b) {
        return a.path.localeCompare(b.path, 'co', {sensitivity: "base"});
      }));
    return inject(sortedFiles,
      {
        starttag: '<!-- inject:' + id + ':js -->',
        relative: true,
        transform: function (filepath) {
          // 自己的js统一使用utf-8格式
          return '<script src="' + filepath.replace(/^\/app\//g, '') + '" charset="utf-8"></script>';
        }
      });
  };
  return gulp.src(env.folders.app + '/*.html')
    // 顶级的文件最先注入，它们通常包括一系列模块定义
    .pipe(injectJs(env.folders.app + '/scripts/*.js', 'app'))
    .pipe(injectJs(env.folders.app + '/scripts/libs/**/*.js', 'libs'))
    .pipe(injectJs(env.folders.app + '/scripts/configs/**/*.js', 'configs'))
    .pipe(injectJs(env.folders.app + '/scripts/services/**/*.js', 'services'))
    .pipe(injectJs(env.folders.app + '/scripts/filters/**/*.js', 'filters'))
    .pipe(injectJs(env.folders.app + '/scripts/directives/**/*.js', 'directives'))
    .pipe(injectJs(env.folders.app + '/scripts/controllers/**/*.js', 'controllers'))
    .pipe(gulp.dest(env.folders.app));
});

gulp.task('copyLibraries', function () {
  // 只引用必要的文件，而不是把库文件全都包含进来。这些文件全都是根据bower.json的main属性过滤的
  var files = _.map(mainBowerFiles(), function (file) {
    return file.replace(env.folders.app + '/bower_components/', '');
  });
  // modernizr没有正常的bower.json，只好强制加入了
  files.push('**/modernizr.js');
  files.push('**/jquery.js');
  files.push('**/*.svg');
  files.push('**/*.eot');
  files.push('**/*.ttf');
  files.push('**/*.woff');

  // js，css交给usemin去处理，中间文件也不用拷贝过去
  var distFiles = _.reject(files, function (fileName) {
    return /.*\.(js|css|scss|less|coffee|ts)/.test(fileName);
  });
  return gulp.src(env.folders.app + '/bower_components/**/*.*')
    .pipe(filter(distFiles))
    .pipe(gulp.dest(env.folders.build + '/bower_components'));
});
gulp.task('copyForks', function () {
  // 如果指定了系统，则将其文件归并到主工程中，否则原样保留
  var forkName = env.args.ios ? 'ios' : env.args.android ? 'android' : '';
  if (forkName)
    return sh.cp('-r', env.folders.app + '/forks/' + forkName + '/*', env.folders.build);
  else
    return sh.cp('-r', env.folders.app + '/forks', env.folders.build);
});
gulp.task('copyViews', function () {
  return gulp.src([env.folders.app + '/views/**/*.html'])
    .pipe(minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe(gulp.dest(env.folders.build + '/views'));
});

gulp.task('copyJs', function () {
  return gulp.src(env.folders.app + '/**/*.js')
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest(env.folders.build));
});

gulp.task('copyImages', function () {
  return gulp.src(env.folders.app + '/images/**/*.*')
    .pipe(imagemin())
    .pipe(gulp.dest(env.folders.build + '/images'));
});

gulp.task('copyFonts', function () {
  sh.cp('-r', env.folders.temp + '/fonts', env.folders.build);
});

gulp.task('copyIcons', function () {
  return gulp.src(env.folders.app + '/*.ico')
    .pipe(gulp.dest(env.folders.build));
});
gulp.task('buildHome', function () {
  return gulp.src(env.folders.app + '/*.html')
    .pipe(usemin({
      css: [minifyCss(), 'concat', rev()],
      html: [minifyHtml({empty: true, comments: true})],
      js: [ngAnnotate(), uglify({preserveComments: $.uglifySaveLicense}), rev()]
    }))
    .pipe(gulp.dest(env.folders.build));
});

gulp.task('buildOffline', function () {
  var lines = [
    'CACHE MANIFEST',
    'NETWORK:',
    '*',
    'CACHE:'
  ];
  return gulp.src(env.folders.build + '/**/*.*')
    .pipe(through.obj(function (file, charset, cb) {
      var fileName = file.path.replace(env.folders.build + '/', '');
      if (fileName !== 'manifest.appcache')
        lines.push(fileName);
      fs.writeFileSync(env.folders.build + '/manifest.appcache', lines.join('\n'), 'utf-8');
      cb();
    }));

});

// 清理源文件
gulp.task('purge', function () {
  return gulp.src([
    env.folders.build + '/styles/**/*.scss',
    env.folders.build + '/scripts/**/*.coffee',
    env.folders.build + '/scripts/**/*.ts'
  ]).on('data', function (file) {
    sh.rm(file.path);
  });
});

gulp.task('compile', function (done) {
  // 全部串行，以免出现两个并发任务同时操作同一个文件的问题，这些步骤中速度不是最重要的
  runSequence('clean', 'bowerInstall', 'webFont', 'wireApp', 'wireBower', 'sass', 'coffee', 'typescript', done);
});

gulp.task('build', function (done) {
  runSequence('compile', 'purge', 'copyForks', 'copyLibraries', 'copyFonts', 'copyImages', 'copyViews',
    'copyIcons', 'buildHome', 'buildOffline', done);
});
