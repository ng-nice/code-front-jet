'use strict';
var items = [
  {
    id: 1,
    name: 'Test'
  }
];

for (var i = 2; i < 100; ++i) {
  items.push({
    id: i,
    name: 'Product - ' + i
  });
}
module.exports = items;
