'use strict';

angular.module('app').controller('HomeIndexCtrl', function HomeIndexCtrl() {
  var vm = this;
  vm.clear = function() {
    vm.name = '';
  }
});
