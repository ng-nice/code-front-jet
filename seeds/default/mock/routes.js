'use strict';

var requireDir = require('require-dir');
var _ = require('lodash');

module.exports = function (server) {
  var resources = requireDir('./resources', {recurse: true});
  var buildRouters = function (resource, resourceName) {
    _.each(resource, function (operation, operationName) {
      if (/^_/.test(operationName)) {
        return;
      }
      if (_.isFunction(operation)) {
        server[operationName](resourceName, operation);
      } else if (_.isPlainObject(operation)) {
        buildRouters(operation, resourceName + '/' + operationName.replace(/\{(.*?)\}/, ':$1'));
      }
    });
  };
  _.each(resources, function (resource, resourceName) {
    buildRouters(resource, resourceName);
  });
};
