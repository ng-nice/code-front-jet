'use strict';

var duplexer = require('plexer');
var svgicons2svgfont = require('gulp-svgicons2svgfont');
var svg2ttf = require('gulp-svg2ttf');
var ttf2eot = require('gulp-ttf2eot');
var ttf2woff = require('gulp-ttf2woff');
var through2 = require('through2');
var fs = require('fs');
var _ = require('lodash');

var File = require('vinyl');

var scss = function() {
  console.log(arguments);
  var obj = through2.obj();
  console.log(obj);
  obj.on('codepoints', function() {
    console.log(arguments);
  });
  return obj;
};
function gulpWebFontScss(options) {
  // Generating SVG font and saving her
  var inStream = svgicons2svgfont(options);
  // Generating TTF font and saving her
  var outStream = inStream.pipe(svg2ttf({clone: true}))
    // Generating EOT font
    .pipe(ttf2eot({clone: true}))
    // Generating WOFF font
    .pipe(ttf2woff({clone: true}));

  var duplex = duplexer({objectMode: true}, inStream, outStream);

  var scssConfig = options.scss;
  if (!scssConfig) {
    throw "scss must be not null"
  }
  // Re-emit codepoint mapping event
  inStream.on('codepoints', function (codepoints) {
    duplex.emit('codepoints', codepoints, options);
    var template = fs.readFileSync(scssConfig.templateFile);
    var content = _.template(template)({
      glyphs: codepoints,
      fontName: options.fontName,
      fontPath: options.fontPath
    });
    var scssFile = new File({
      cwd: scssConfig.base,
      base: scssConfig.base,
      path:scssConfig.filename,
      contents: new Buffer(content)
    });
    outStream.push(scssFile);
  });

  return duplex;
}

module.exports = gulpWebFontScss;
