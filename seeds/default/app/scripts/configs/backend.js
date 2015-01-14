'use strict';
angular.module('app').constant('backend', {
  // 后端api配置
  api: {
    root: '/api/',
    key: '',
    security: ''
  }
});
angular.module('app').config(function(RestangularProvider, backend) {

});