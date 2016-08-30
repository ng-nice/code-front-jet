'use strict';

var gulp = require('gulp');
var path = require('path');
var fs = require('fs');

var sh = require('shelljs');
var exec = require('../utils/exec');
var _ = require('lodash');
var configure = require('../utils/configure');


var log = require('../utils/log');
var env = require('../utils/env');
var plugins = require('../utils/plugins');
var configure = require('../utils/configure');


gulp.task('clean', function () {
  if (fs.existsSync(env.folders.build)) {
    sh.rm('-fr', path.join(env.folders.build, '*'));
  }
  if (fs.existsSync(env.folders.temp)) {
    sh.rm('-fr', path.join(env.folders.temp, '*'));
  }
});

var getAppFiles = function (filter) {
  return [env.folders.app + filter, '!' + env.folders.app + '/forks' + filter];
};

gulp.task('bowerInstall', function () {
  // 用于CI系统时，请加上--ci参数
  return exec('bower', ['install', '--config.interactive=' + !env.args.ci, '--allow-root']).catch(function () {
    log.error("bower install失败，可能网络有问题或存在版本冲突，请手动运行bower install命令来解决它。");
    process.exit(1);
  });

});

gulp.task('sass', function () {
  return gulp.src(env.folders.app + '/styles/**/*.scss')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass.sync({
      includePaths: [
        env.folders.app + '/styles'
      ],
      imagePath: env.folders.app + '/images'
    }))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest(env.folders.temp + '/app'));
});

var filesOf = function (extensionName) {
  return [
    env.folders.app + '/**/*.' + extensionName,
    env.folders.test + '/**/*.' + extensionName,
    env.folders.mock + '/**/*.' + extensionName,
    '!' + env.folders.mock + '/node_modules/**/*.' + extensionName
  ];
};

gulp.task('coffee', function () {
  return gulp.src(filesOf('coffee'), {base: env.folders.project})
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.coffee({bare: true}))
    .on('error', log.error)
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest(env.folders.temp));
});

gulp.task('es6', function () {
  return gulp.src(filesOf('es6'), {base: env.folders.project})
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.es6())
    .on('error', log.error)
    .pipe(plugins.sourcemaps.write())
    .pipe(plugins.rename({
      extname: ".js"
    }))
    .pipe(gulp.dest(env.folders.temp));
});

gulp.task('typescript', function () {
  return gulp.src(filesOf('ts').concat(['!' + env.folders.project + '/**/*.d.ts']), {base: env.folders.project})
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.typescript({
      declarationFiles: true
    })).js
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest(env.folders.temp));
});

gulp.task('lint', function () {
  // 第三方库的js不进行lint
  return gulp.src(filesOf('js'))
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
      fontPath: 'fonts/',
      normalize: true,
      scss: {
        base: env.folders.temp + '/app/fonts', // 必须和dest中的路径相同，否则_icons.scss写入的位置会有问题
        templateFile: env.folders.frontJet + '/app/assets/app/_icons.scss.tpl',
        filename: env.folders.app + '/styles/_icons.scss'
      },
      appendCodepoints: true // 保留原有代码位，以免新版本刚发布时css对应的图标混乱
    }))
    .pipe(gulp.dest(env.folders.temp + '/app/fonts'));
});

gulp.task('wireBowerJs', function () {
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
            // 强制使用utf-8格式
            js: '<script src="{{filePath}}" charset="utf-8"></script>'
          }
        }
      }
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('wireBowerCss', function () {
  return gulp.src(env.folders.app + '/*.html')
    .pipe(plugins.plumber())
    .pipe(plugins.filter(function (file) {
      return /<!--\s*bower:css\s*-->/.test(file.contents);
    }))
    .pipe(plugins.wiredep({
      directory: env.folders.library,
      dependencies: true,
      devDependencies: false
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('wireBower', function (done) {
  plugins.runSequence('bowerInstall', 'wireBowerJs', 'wireBowerCss', done)
});

var sortByFileName = function (file1, file2) {
  return -file1.relative.localeCompare(file2.relative);
};
gulp.task('wireAppJs', function () {
  // 按照约定优于配置的原则将js文件注入所有根目录下的文件
  var injectJs = function (files) {
    return plugins.inject(files,
      {
        starttag: '<!-- inject:app:js -->',
        relative: true,
        transform: function (filepath, file) {
          // 自己的js统一使用utf-8格式
          return '<script src="' + toPosixPath(file.relative) + '" charset="utf-8"></script>';
        }
      });
  };

  var appFiles = gulp.src(getAppFiles('/**/*.js').concat(['!' + env.folders.app + '/**/*.test.js', '!' + env.folders.temp + '/app/**/*.test.js']), {base: env.folders.app});
  var sortedFiles = appFiles
    .pipe(plugins.sort(sortByFileName))
    .pipe(plugins.angularFileSort());

  return gulp.src(env.folders.app + '/*.html')
    .pipe(plugins.plumber())
    // 整理出文件依赖关系，然后注入
    .pipe(injectJs(sortedFiles))
    .pipe(gulp.dest(env.folders.app));
});

gulp.task('wireAppScss', function () {
  // 按照约定优于配置的原则将scss文件注入所有styles目录下的文件
  var injectScss = function (files) {
    return plugins.inject(files,
      {
        starttag: '// inject:page:scss',
        endtag: '// endinject',
        relative: true,
        transform: function (filepath, file) {
          return '@import "' + toPosixPath(file.relative) + '";';
        }
      });
  };

  var stylesPath = env.folders.app + '/styles';
  var filter = '/**/*.scss';
  // 除了styles中的scss以外，都注入进来
  var appFiles = gulp.src(getAppFiles(filter).concat(['!' + stylesPath + filter]), {base: stylesPath});
  //
  var sortedFiles = appFiles
    .pipe(plugins.sort(sortByFileName));

  return gulp.src(stylesPath + filter)
    .pipe(plugins.plumber())
    // 整理出文件依赖关系，然后注入
    .pipe(injectScss(sortedFiles))
    .pipe(gulp.dest(stylesPath));
});

gulp.task('wireApp', function (done) {
  plugins.runSequence('wireAppJs', 'wireAppScss', done);
});

gulp.task('copyLibraries', function () {
  var files = plugins.mainBowerFiles();

  var libraryPath = env.folders.project + '/bower_components';
  // js，css交给usemin去处理，中间文件不用拷贝过去
  _.each(['js', 'css', 'scss', 'less', 'coffee', 'ts', 'dart'], function (ext) {
    files.push('!' + libraryPath + '/**/*.' + ext);
  });

  return gulp.src(files, {base: libraryPath})
    .pipe(gulp.dest(env.folders.build + '/bower_components'));
});
gulp.task('copyForks', function () {
  // 如果指定了系统，则将其文件归并到主工程中，否则原样保留
  //var forkName = env.args.ios ? 'ios' : env.args.android ? 'android' : 'default';
  //return sh.cp('-r', env.folders.app + '/forks/' + forkName + '/*', env.folders.build);
});

var htmlMinifyOptions = {
  conditionals: true, // ie条件注释留着
  empty: true,
  spare: true,
  quotes: true
};

gulp.task('copyViews', function () {
  // 子页面处理下，根目录下的不用管
  return gulp.src([env.folders.app + '/**/*.html', '!' + env.folders.app + '/*.html'], {base: env.folders.app})
    .pipe(plugins.plumber())
    .pipe(plugins.minifyHtml(htmlMinifyOptions))
    .pipe(plugins.ngHtml2js({
      moduleName: env.config.name || 'app',
      declareModule: false
    }))
    .pipe(plugins.concat('templates.js'))
    .pipe(gulp.dest(env.folders.temp + '/shadow'));
});

gulp.task('copyAssets', function () {
  return gulp.src(env.folders.app + '/assets/**/*.*')
    .pipe(gulp.dest(env.folders.build + '/assets'));
});

gulp.task('copyImages', function () {
  return gulp.src(env.folders.app + '/images/**/*.*')
    .pipe(plugins.plumber())
    .pipe(gulp.dest(env.folders.build + '/images'));
});

gulp.task('copyFonts', function () {
  return gulp.src(env.folders.app + '/fonts/**/*.*')
    .pipe(gulp.dest(env.folders.build + '/fonts'));
});

gulp.task('copyIcons', function () {
  return gulp.src(env.folders.app + '/*.ico')
    .pipe(gulp.dest(env.folders.build));
});

gulp.task('buildHome', function () {
  var assets = plugins.useref.assets();
  var isJs = function (file) {
    return /^.*\.js$/.test(file.relative);
  };
  var isAppJs = function (file) {
    return isJs(file) && !/^\w*\/vendor.*\.js$/.test(toPosixPath(file.relative));
  };
  return gulp.src('app/*.html')
    .pipe(plugins.plumber())
    .pipe(assets)
    .pipe(plugins.rev())
    .pipe(plugins.if(isAppJs, plugins.ngAnnotate()))
    .pipe(plugins.if(isJs, plugins.uglify()))
    .pipe(plugins.if('*.css', plugins.csso()))
    .pipe(assets.restore())
    .pipe(plugins.useref())
    .pipe(plugins.revReplace())
    .pipe(gulp.dest(env.folders.build));
});

gulp.task('buildManifest', function () {
  return gulp.src(env.folders.build + '/**/*.*')
    .pipe(plugins.plumber())
    .pipe(plugins.manifest({
      hash: true,
      preferOnline: true,
      network: ['http://*', 'https://*', '*'],
      filename: 'app.manifest',
      exclude: 'app.manifest'
    }));
});

gulp.task('config', function () {
  configure(env.folders.project + '/fj.conf.js', env.config);
});

gulp.task('compile', function (done) {
  // 全部串行，以免出现两个并发任务同时操作同一个文件的问题，这些步骤中速度不是最重要的
  plugins.runSequence('clean', 'bowerInstall', 'webFont', 'wireApp', 'wireBower', 'sass', 'coffee', 'es6', 'typescript', done);
});

gulp.task('build', function (done) {
  plugins.runSequence('config', 'compile', 'copyForks', 'copyLibraries', 'copyFonts', 'copyAssets', 'copyImages', 'copyViews',
    'copyIcons', 'buildHome', 'buildManifest', 'preview.reload', done);
});

var path = require('path');
function toPosixPath(fileName) {
  if (!fileName) {
    return fileName;
  }
  return fileName.replace(/\\/g, '/');
}
