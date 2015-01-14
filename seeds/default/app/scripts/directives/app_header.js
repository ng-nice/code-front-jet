'use strict';
angular.module('app').directive('appHeader', function appHeader(currentHeader) {
  return {
    restrict: 'EA',
    scope: {
    },
    templateUrl: 'views/common/app_header.html',
    link: function (scope, element, attrs) {
      scope.vm = {
        goBack: function() {
          window.history.go(-1);
        },
        allowGoBack: function() {
          return !currentHeader.back.hidden && (currentHeader.back.title || currentHeader.back.icon);
        },
        toggleMenu: function() {
          this.menuVisible = !this.menuVisible;
        },
        menuClicked: function(item) {
          this.menuVisible = false;
          if (item.callback) {
            item.callback.call(item, item);
          }
        },
        header: currentHeader
      };
    }
  };
});