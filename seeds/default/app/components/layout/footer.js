'use strict';

angular.module('app').controller('LayoutFooterCtrl', function LayoutFooterCtrl($scope) {
  var vm = $scope.vm = {};

});
angular.module('app').directive('layoutFooter', function LayoutFooter() {
  return {
    restrict: 'EA',
    scope: {},
    templateUrl: 'components/layout/footer.html',
    controller: 'LayoutFooterCtrl'
  };
});
