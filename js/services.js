'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1');


var monitoringServices = angular.module('monitoringServices', ['ngResource']);

monitoringServices.factory('socket', function ($rootScope) {
  var socket = io.connect('http://localhost:8080');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

monitoringServices.provider('Monitoring',  function() {
    this.$get = function($http, $location, $q, $rootScope, $resource) { // injectables go here
    var self = this;
    var isError = function(msg){
        if(msg.error){
          $rootScope.isConnected = false;
          $rootScope.errorMsg=msg.errorMsg;
          if($rootScope.errorMsg === "Error: MonitoringDB database does not exist!"){
            $rootScope.noDB = true;
          }
          else{
            $rootScope.noDB = false;
          }
          console.log($rootScope.errorMsg);
          $location.path("/admin_server");
          return true;
        }
        else{
          $rootScope.isConnected = true;
          return false;
        }
    };
    var monitoring = {
        probes: {'empty':true},
        probesmanagement: {'empty':true},
        probe_acqu_mode: {'empty':true},
        
        setConfig: function(newConfig) {
            //First we check server connection
            var deferred = $q.defer();
            $http.post('/monitoring.query?callback=setConfig',newConfig)
            .then(function(response){
                if(!isError(response.data) && response.data.monitoring){
                    deferred.resolve({error:false});
                }else{
                    deferred.reject(response.data);
                }
            })
            .catch(function(){
                $rootScope.errorMsg="Cannot connect to database, check your configuration!";
                console.log($rootScope.errorMsg);
                deferred.reject({error:true, errorMsg:$rootScope.errorMsg});
            });
            return deferred.promise;
        },
        getConfig: function() {
            var deferred = $q.defer();
            $http.get('/monitoring.query?callback=getConfig')
            .then(function(response){
                deferred.resolve(response.data);
            }, function(){
                deferred.reject();
            });
            return deferred.promise;
        },
        getProbesManagement: function() {
            var deferred = $q.defer();
            $http.get('/monitoring.query?callback=getProbesManagement')
            .then(function(response){
                if(!isError(response.data)){
                  deferred.resolve(response.data);
                }
                else{
                  deferred.reject({error:true});
                }
            });
            return deferred.promise;
        },
        getProbes: function() {
            var deferred = $q.defer();
            $http.get('/monitoring.query?callback=getProbes')
            .then(function(response){
                if(!isError(response.data)){
                  deferred.resolve(response.data);
                }
                else{
                  deferred.reject({error:true});
                }
            });
            return deferred.promise;
        },
        getProbeConfig: function(probeUID) {
            var deferred = $q.defer();
            $http.get('/monitoring.query?callback=getProbeConfig&probeUID='+probeUID)
            .then(function(response){
                if(!isError(response.data)){
                  deferred.resolve(response.data);
                }
                else{
                  deferred.reject({error:true});
                }
            });
            return deferred.promise;
        },
        getProbeAcquMode: function() {
            var deferred = $q.defer();
            $http.get('/monitoring.query?callback=getProbeAcquMode')
            .then(function(response){
                if(!isError(response.data)){
                  deferred.resolve(response.data);
                }
                else{
                  deferred.reject({error:true});
                }
            });
            return deferred.promise;
        },
        linkAcquModeToConfig: function(probeAcquModeUID, probeConfigUID) {
            var deferred = $q.defer();
            $http.post('/monitoring.query?callback=linkAcquModeToConfig&probeAcquModeUID='+probeAcquModeUID+'&probeConfigUID='+probeConfigUID, {data:false})
            .then(function(response){
                if(!isError(response.data)){
                  deferred.resolve(response.data);
                }
                else{
                  deferred.reject({error:true});
                }
            });
            return deferred.promise;
        }
    };
    return monitoring;
    }
});