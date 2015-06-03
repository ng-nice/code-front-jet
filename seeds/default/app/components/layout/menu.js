'use strict';

angular.module('app').controller('LayoutMenuCtrl', function LayoutMenuCtrl($scope) {
  var vm = $scope.vm = {};
});
angular.module('app').directive('layoutMenu', function LayoutMenu() {
  return {
    restrict: 'EA',
    scope: {},
    templateUrl: 'components/layout/menu.html',
    controller: 'LayoutMenuCtrl'
  };
});
