'use strict';

angular.module('app').service('utils', function Utils() {
  this.getControllerCss = function (controller) {
    if (!controller || !angular.isString(controller)) {
      return '';
    }

    var ctrl = controller.match(/(\w+)Ctrl\s+as\s+vm/) || controller.match(/(\w+)Ctrl/);
    if (!ctrl) {
      return '';
    }
    return 'c-' + ctrl[1];
  };
});
