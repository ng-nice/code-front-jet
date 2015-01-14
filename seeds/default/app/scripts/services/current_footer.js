'use strict';
angular.module('app').service('currentFooter', function CurrentFooter() {
  // angular will `new CurrentFooter()` as a singleton
  this.copyright = "copyright by ThoughtWorks";
});