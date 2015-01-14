'use strict';
angular.module('app').config(function ($locationProvider, $stateProvider, $urlRouterProvider) {
  $locationProvider.hashPrefix('!');
  $locationProvider.html5Mode(true);
  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'views/home/index.html'
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

});
