'use strict';

angular.module('app').service('ui', function Ui() {
  this.error = function(message) {
    // TODO: 实现界面显示逻辑
    console.log(message);
  }
});
