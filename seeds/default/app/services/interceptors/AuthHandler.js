'use strict';
angular.module('app').factory('AuthHandler', function ($q) {
  var AuthHandler = {};
  AuthHandler.request = function (config) {
    if (config.data && config.data.$skipAuthHandler) {
      config.$skipAuthHandler = true;
      delete config.data.$skipAuthHandler;
    }
    if (config.params && config.params.$skipAuthHandler) {
      config.$skipAuthHandler = true;
      delete config.params.$skipAuthHandler;
    }
    return $q.when(config);
  };
  AuthHandler.responseError = function (rejection) {
    if (rejection.status === 401 && rejection.config && !rejection.config.$skipAuthHandler && !rejection.config.url.match(/.*\/captcha.jpg$/)) {
      // 如果已经弹出了对话框，则不再弹出，而是把当前的request追加到列表
      var deferred = $q.defer();
      // TODO: 实现登录重试逻辑
      console.error('请自行实现登录重试逻辑，参见http://witoldsz.github.io/angular-http-auth/');
      return deferred.promise;
    } else {
      return $q.reject(rejection);
    }
  };
  return AuthHandler;
});
