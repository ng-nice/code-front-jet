'use strict';

var items = require('./_items');
module.exports = function (req, res, next) {
  if (req.params.filter === 'recent') {
    res.send(items.slice(0, 3));
  } else {
    res.send(items);
  }
  next();
};
