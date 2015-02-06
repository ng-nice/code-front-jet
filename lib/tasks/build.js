'use strict';

var gulp = require('gulp');
var path = require('path');
var fs = require('fs');

var sh = require('shelljs');
var exec = require('../utils/exec');
var _ = require('underscore');


var log = require('../utils/log');
var env = require('../utils/env');
var plugins = require('../utils/plugins');

gulp.task('clean', function () {
  sh.rm('-fr', path.join(env.folders.build, '*'));
  sh.rm('-fr', path.join(env.folders.temp, '*'));
});

gulp.task('bowerInstall', function () {
  // 用于CI系统时，请加上--ci参数
  return exec('bower', ['install', '--config.interactive=' + !env.args.ci, '--allow-root']).catch(function () {
    log.error("bower install失败，可能网络有问题或存在版本冲突，请手动运行bower install命令来解决它。");
    process.exit(1);
  });
});

gulp.task('sass', function () {
  return gulp.src(env.folders.app + '/styles/**/*.scss')
    // 解决windows下的gulp-sass bug：https://github.com/dlmanning/gulp-sass/issues/28
    .on('data', function (file) {
      if (process.platform === 'win32') {
        // 变成相对路径
        file.path = path.relative('.', file.path);
        // 把反斜杠变成正斜杠
        file.path = file.path.replace(/\\/g, '/');
      }
    })
    .pipe(plugins.sass({
      sourceComments: 'map',
      includePaths: [
        env.folders.app + '/styles'
      ],
      imagePath: env.folders.app + '/images',
      onError: function (err) {
        if (err.code === 1) {
          log.error(err.file + ' @ ' + err.line + ':' + err.column + '. error: ' + err.message);
        } else {
          log.message(err.file + ' @ ' + err.line + ':' + err.column + '. level: ' + err.code + ', message:' + err.message)
        }
      }
    }))
    .pipe(gulp.dest(env.folders.temp + '/app/styles'));
});

gulp.task('coffee', function () {
  return gulp.src(env.folders.project + '/**/*.coffee')
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.coffee({bare: true}))
    .on('error', log.error)
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest(env.folders.temp));
});

gulp.task('typescript', function () {
  return gulp.src([env.folders.project + '/**/*.ts', '!' + env.folders.project + '/**/*.d.ts'])
    .pipe(plugins.plumber())
    .pipe(plugins.tsc({sourcemap: true, declaration: true, emitError: false}))
    .pipe(gulp.dest(env.folders.temp));
});

gulp.task('lint', function () {
  // 第三方库的js不进行lint
  return gulp.src([env.folders.app + '/**/*.js', '!' + env.folders.library + '/**/*.js'])
    .pipe(plugins.plumber())
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});

gulp.task('webFont', function () {
  var fontName = 'app-icons';
  return gulp.src(env.folders.app + '/icons/**/*.svg')
    .pipe(plugins.plumber())
    // gulp-iconfont/gulp-iconfont-css不能正确处理appendCodepoints的情况，所以自己写了一个webFontScss插件
    .pipe(plugins.webFontScss({
      fontName: fontName, // required
      normalize: true,
      scss: {
        base: env.folders.app + '/fonts',
        templateFile: env.folders.frontJet + '/lib/plugins/_icons.scss.tpl',
        filename: env.folders.app + '/styles/_icons.scss' // 必须使用到dist的相对路径
      },
      appendCodepoints: true // 保留原有代码位，以免新版本刚发布时css对应的图标混乱
    }))
    .pipe(gulp.dest(env.folders.app + '/fonts'));
});

gulp.task('wireBower', ['bowerInstall'], function () {
  // 把对bower js的引用注入到html文件中
  return gulp.src(env.folders.app + '/*.html')
    .pipe(plugins.plumber())
    .pipe(plugins.wiredep({
      directory: env.folders.library,
      dependencies: true,
      devDependencies: false,
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
  var injectJs = function (files, id) {
    return plugins.inject(files,
      {
        starttag: '<!-- inject:' + id + ':js -->',
        relative: true,
        transform: function (filepath, file) {
          // 自己的js统一使用utf-8格式
          return '<script src="' + file.relative + '" charset="utf-8"></script>';
        }
      });
  };

  var filter = '/**/*.js';
  var appFiles = gulp.src([env.folders.app + filter, '!' + env.folders.library + filter], {base: env.folders.app});
  var tmpFiles = gulp.src(env.folders.temp + '/app' + filter, {base: env.folders.temp + '/app'});
  var sortedFiles = plugins.merge(appFiles, tmpFiles)
    .pipe(plugins.angularFileSort());

  return gulp.src(env.folders.app + '/*.html')
    .pipe(plugins.plumber())
    // 整理出文件依赖关系，然后注入
    .pipe(injectJs(sortedFiles, 'app'))
    .pipe(gulp.dest(env.folders.app));
});

gulp.task('copyLibraries', function () {
  // 只引用必要的文件，而不是把库文件全都包含进来。这些文件全都是根据bower.json的main属性过滤的
  var bowerFiles = plugins.mainBowerFiles();

  // js，css交给usemin去处理，中间文件不用拷贝过去
  var distFiles = _.reject(bowerFiles, function (fileName) {
    return /.*\.(js|css|scss|less|coffee|ts)/.test(fileName);
  });

  return gulp.src(distFiles, {base: env.folders.library})
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

var htmlMinifyOptions = {
  conditionals: true, // ie条件注释留着
  empty: true,
  spare: true,
  quotes: true
};

gulp.task('copyViews', function () {
  return gulp.src([env.folders.app + '/**/*.html', '!' + env.folders.app + '/*.html', '!' + env.folders.library + '/**/*.html'], {base: env.folders.app})
    .pipe(plugins.plumber())
    .pipe(plugins.minifyHtml(htmlMinifyOptions))
    .pipe(plugins.ngHtml2js({
      moduleName: 'app',
      declareModule: false
    }))
    .pipe(plugins.concat('templates.js'))
    .pipe(gulp.dest(env.folders.temp + '/shadow/templates'));
});

gulp.task('copyImages', function () {
  return gulp.src(env.folders.app + '/images/**/*.*')
    .pipe(plugins.plumber())
    .pipe(plugins.imagemin())
    .pipe(gulp.dest(env.folders.build + '/images'));
});

gulp.task('copyFonts', function () {
  return gulp.src(env.folders.temp + '/fonts')
    .pipe(gulp.dest(env.folders.build));
});

gulp.task('copyIcons', function () {
  return gulp.src(env.folders.app + '/*.ico')
    .pipe(gulp.dest(env.folders.build));
});

gulp.task('buildHome', function () {
  var jsFilter = plugins.filter('**/*.js');
  var cssFilter = plugins.filter('**/*.css');
  var assets = plugins.useref.assets();
  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe(plugins.debug())
    .pipe(plugins.rev())
    .pipe(jsFilter)
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.uglify({preserveComments: plugins.uglifySaveLicense}))
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe(plugins.csso())
    .pipe(cssFilter.restore())
    .pipe(assets.restore())
    .pipe(plugins.useref())
    .pipe(plugins.revReplace())
    .pipe(plugins.minifyHtml(htmlMinifyOptions))
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
    .pipe(plugins.plumber())
    .pipe(plugins.through.obj(function (file, charset, cb) {
      var fileName = file.path.replace(env.folders.build + '/', '');
      if (fileName !== 'manifest.appcache') {
        lines.push(fileName);
      }
      fs.writeFileSync(env.folders.build + '/manifest.appcache', lines.join('\n'), 'utf-8');
      cb();
    }));

});

gulp.task('compile', function (done) {
  // 全部串行，以免出现两个并发任务同时操作同一个文件的问题，这些步骤中速度不是最重要的
  plugins.runSequence('clean', 'bowerInstall', 'webFont', 'wireApp', 'wireBower', 'sass', 'coffee', 'typescript', done);
});

gulp.task('build', function (done) {
  plugins.runSequence('compile', 'copyForks', 'copyLibraries', 'copyFonts', 'copyImages', 'copyViews',
    'copyIcons', 'buildHome', 'buildOffline', done);
});
