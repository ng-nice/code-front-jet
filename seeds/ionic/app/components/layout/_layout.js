'use strict';

angular.module('app').controller('AppLayoutCtrl', function AppLayoutCtrl() {
  var vm = this;
  var platform = vm.platformCss = {};
  platform['platform-android'] = ionic.Platform.isAndroid();
  platform['platform-ios'] = ionic.Platform.isIOS();
  platform['platform-ipad'] = ionic.Platform.isIPad();
});
angular.module('app').directive('appLayout', function appLayout() {
  return {
    restrict: 'EA',
    scope: {},
    templateUrl: 'components/layout/_layout.html',
    controller: 'AppLayoutCtrl as vm'
  };
});
