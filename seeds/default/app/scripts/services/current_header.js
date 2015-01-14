'use strict';
angular.module('app').service('currentHeader', function CurrentHeader($rootScope) {
  var self = this;

  // angular will `new CurrentHeader()` as a singleton
  // 是否强制隐藏
  this.hidden = false;
  // 返回按钮，默认显示上一页的标题，行为是window.go(-1)，可定制
  this.back = {
    // 是否强制隐藏
    hidden: false,
    // 图标
    icon: 'ion-chevron-left',
    // 标题，默认取前一个路由的标题
    title: null,
    // 链接，如果为null则通过window.go(-1)执行后退操作
    url: null
  };
  // 页图标
  this.icon = null;
  // 标题，默认取当前路由的标题
  this.title = null;
  // 按钮
  this.buttons = {
    template: {
      title: ''
    },
    left: [],
    right: []
  };
  // 菜单
  this.menu = {
    hidden: false,
    items: []
  };
  // 自定义标题，如果指定，则执行下面的controller和templateUrl生成页面，渲染于此。
  // 一旦指定，则优先于其他
  this.custom = {
    // 模板
    templateUrl: null,
    // 控制器，注意，如果使用普通函数并且传入了注入参数，则自动报错，防止被ngmin之后发生问题
    controller: null
  };

  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    self.title = toState.title;
    self.icon = toState.icon;
    self.back.title = fromState.title;
    self.back.icon = fromState.icon;
  });
});