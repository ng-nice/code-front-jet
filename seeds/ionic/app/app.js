'use strict';

// 这里只创建模块，不要写逻辑，所依赖的模块可以根据需要裁减
angular.module('app', [
  'ngAnimate',  // 动画效果
  'ngResource', // 访问REST对象
  'ui.router',  // 第三方的路由访问器
  'ionic',
  'ngTouch'
]);
