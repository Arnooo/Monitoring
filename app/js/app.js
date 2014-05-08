'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers',
  'monitoringServices'
]);

app.config(['$routeProvider', 'MonitoringProvider', 'CONFIG', function($routeProvider, MonitoringProvider, CONFIG) {
  $routeProvider.when('/monitoring', {templateUrl: 'partials/monitoring.html', controller: 'MonitoringCtrl'});
  $routeProvider.when('/admin_probes', {templateUrl: 'partials/admin_probes.html', controller: 'AdminProbesCtrl'});
  $routeProvider.when('/admin_server', {templateUrl: 'partials/admin_server.html', controller: 'AdminServerCtrl'});
  $routeProvider.when('/dashboard_probes_management', {templateUrl: 'partials/dashboard_probes_management.html', controller: 'ProbesManagementCtrl'});
  $routeProvider.otherwise({redirectTo: '/monitoring'});
}]);

app.controller('MainCtrl', 
        ['Monitoring', '$scope', '$location', 'CONFIG',
         function(Monitoring, $scope, $location, CONFIG) {

      
}]);

app.run(['Monitoring', 'CONFIG', '$rootScope', '$location', function(Monitoring, CONFIG, $rootScope, $location) {
    $rootScope.isConnected = true;
    Monitoring.setConfig(CONFIG)
    .then(function(){
    })
    .catch(function(){
      $location.path("/admin_server");
    });
}]);

angular.element(document).ready(
  function() {
    var initInjector = angular.injector(['ng']);
    var $http = initInjector.get('$http');
    $http.get('monitoring.query?callback=getConfig').then(
      function(response) {
        app.constant('CONFIG', response.data);
        angular.bootstrap(document, ['myApp']);
      }
    );
  }
);

