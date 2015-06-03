'use strict';

angular.module('app').controller('LayoutHeaderCtrl', function LayoutHeaderCtrl($scope, page, $ionicSideMenuDelegate) {
  var vm = $scope.vm = {};
  vm.page = page;
  vm.menu = $ionicSideMenuDelegate;
});

angular.module('app').directive('layoutHeader', function LayoutHeader() {
  return {
    restrict: 'EA',
    scope: {},
    templateUrl: 'components/layout/header.html',
    controller: 'LayoutHeaderCtrl'
  };
});
