'use strict';

var chalk = require('chalk');

var widthOf = function (text) {
  var width = 0;
  for (var i = 0; i < text.length; ++i) {
    ++width;
    var char = text[i];
    if (char > '\xff') ++width;
  }
  return width;
};
var addPaddingTo = function (text, size) {
  var result = text;
  for (var i = widthOf(text); i < size; ++i) {
    result += ' ';
  }
  return result;
};
var splitTo = function (text, size) {
  var lines = [];
  var line = '';
  var width = 0;
  for (var i = 0; i < text.length; ++i) {
    var char = text[i];
    width += widthOf(char);
    line += char;
    if (width >= size || i === text.length - 1) {
      lines.push(line);
      width = 0;
      line = '';
    }
  }
  return lines;
};

module.exports = function showHelp(command, help) {
  var columns = process.stdout.columns - 2;
  var headerWidth = 40;
  var spaces = addPaddingTo('', 2);
  var lines = splitTo(help, columns - spaces.length - headerWidth);
  command = addPaddingTo(command, headerWidth);
  for (var j = 0; j < lines.length; ++j) {
    if (j === 0) {
      process.stdout.write(chalk.green(command));
    } else {
      process.stdout.write(chalk.green(addPaddingTo('', headerWidth)));
    }
    process.stdout.write(spaces);
    process.stdout.write(chalk.green(lines[j]));
    process.stdout.write('\n');
  }
  if (lines.length > 1) {
    process.stdout.write('\n');
  }
};
