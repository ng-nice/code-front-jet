'use strict';

angular.module('app').run(function(page, $rootScope) {
  $rootScope.$on('$stateChangeSuccess', function(event, state) {
    document.title = page.title = state.label;
  });
});
