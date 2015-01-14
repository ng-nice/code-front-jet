'use strict';

angular.module('app').directive('appFooter', function appFooter(currentFooter) {
  return {
    restrict: 'EA',
    scope: {

    },
    templateUrl: 'views/common/app_footer.html',
    link: function (scope, element, attrs) {
      scope.vm = {
        footer: currentFooter
      };
    }
  };
});