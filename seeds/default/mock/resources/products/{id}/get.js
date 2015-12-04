'use strict';

var items = require('../_items');
var _ = require('lodash');

module.exports = function(req, res, next) {
  var item = _.findWhere(items, {id: +req.params.id});
  if (!item) {
    return next(new restify.ResourceNotFoundError('条目未找到：' + req.params.id));
  }
  res.send(item);
};
