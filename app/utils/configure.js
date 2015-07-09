'use strict';

var _ = require('lodash');

module.exports = function (file, defaultValue) {
  delete require.cache[require.resolve(file)];
  var configure = require(file);
  configure(defaultValue);
};