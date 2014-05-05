'use strict';

/* Controllers */

var myAppCtrl = angular.module('myApp.controllers', []);

myAppCtrl.controller('MonitoringCtrl', 
  			['socket','$scope', '$http', 'Monitoring',
  			 function(socket, $scope, $http, Monitoring) {

    //Init general variables;
    $scope.serverMonitoring = "http://localhost:8000/";
    $scope.graphs = undefined;

    var initGraph = function (graphName){
      $scope.graphs[graphName] = {
          last: [],
          data: [],
          opts: { 
              title: 'CPU Temperature',
              labels: [ "Time", "°C"], 
              //ylabel: 'Temperature (°C)',
              width: 1024,
              height: 300,
              showRangeSelector: true,
              rollPeriod: 1,
              xRangePad:1,
              showRoller: true,
              legend: 'always'
          }
      };
    };

    socket.on('newValue', function(data){
        //console.log("New data from server");
        var timestamp = data.datetime - 600000; //10min
        var graphName = data.probe_history_table_uid;
        if(!$scope.graphs){
          $scope.graphs = {};
        }
        if(!$scope.graphs[graphName]){
          initGraph(graphName);
        }
      //  $scope.graphs[graphName].opts.dateWindow = [new Date(timestamp), new Date(data.datetime)];
        var date=new Date(data.timestamp);
        $scope.graphs[graphName].data = $scope.graphs[graphName].data+""+ date+","+ data.value+"\n";
        $scope.graphs[graphName].last = [date, data.value];
    });

    $scope.updateCharts = function (){
      Monitoring.getProbesManagement()
      .then(function(data){
          var item = data[0];
          for (var i = 0, item; item = data[i]; i++) {
              var graphName = item.probe_history_table_uid;
              if(!$scope.graphs){
                $scope.graphs = {};
              }
              if(!$scope.graphs[graphName]){
                initGraph(graphName);
              }
              $scope.graphs[graphName].opts.title = "| "+item.probe_name+" | "+item.probe_type+"";
              $scope.graphs[graphName].opts.labels = [ "Time", item.unit];
              $http.get($scope.serverMonitoring+'monitoring.csv?callback=getProbeHistory&historyTable='+item.probe_history_table_uid)
              .success(function(data, status, headers, config){
                  var graphName = config.url.replace(/.*historyTable=/, '');
                  $scope.graphs[graphName].data = data;

                  //Get last value
                  var lines = data.trim().split('\n');
                  var lastLine = lines.slice(-1)[0];
                  var fields = lastLine.split(',');

                  $scope.graphs[graphName].last = fields;
              });
          }
      });
      
     /* .error(function(err){
          console.error(err);
      });*/
    }

    $scope.updateCharts();

}]); 

myAppCtrl.controller('AdminProbesCtrl', 
        ['$scope', '$http', 'Monitoring', 
         function($scope, $http, Monitoring ) {

    //////////////////////////////////////////
    //Init general variables;
    //////////////////////////////////////////
    $scope.serverMonitoring = "http://localhost:8000/";
    $scope.newProbe={probe_uid: -1, probe_name: "Simulation probe", description:"This probe use a fack sensor to get random temperature data."};
    $scope.newProbeConfig={probe_config_uid: -1, probe_type: "Temperature", node_module:"fack-sensor", unit:"°C"};
    $scope.newProbeAcquMode={probe_acqu_mode_uid: -1, acquisition_mode_name: "Default mode", acquisition_mode:"ASAP"};
    $scope.selectAMode={probe_acqu_mode_uid: -2, acquisition_mode_name: "Please, select a mode!"};
    $scope.acquModeOptions=['ASAP', 'ONTIME'];

    //////////////////////////////////////////
    // Init methods
    //////////////////////////////////////////
    $scope.initProbesList = function(){
      $scope.probeSelected_uid = -1;
      $scope.probeSelected = undefined;
      $scope.probes = [];
    };

    $scope.initProbeConfigList = function(){
      $scope.probeAcquModeSelected_uid = -1;
      $scope.probeAcquModeSelected = undefined;
      $scope.probeConfig = [];
    };

    $scope.initProbeAcquModeList = function(){
      $scope.probeConfigSelected_uid = -1;
      $scope.probeConfigSelected = undefined;
      $scope.probeAcquMode = [];
    };

    //////////////////////////////////////////
    // Get data from DB
    //////////////////////////////////////////
    $scope.getProbeAcquMode = function (){
      Monitoring.getProbeAcquMode()
      .then(function(data){
            if(data.length !== 0){
              $scope.probeAcquMode = data;
              if($scope.probeConfigSelected != undefined &&
                $scope.probeConfigSelected.probe_acqu_mode_uid !=null ){
                  var item = $scope.probeAcquMode[0];
                  for (var i = 0, item; item = $scope.probeAcquMode[i]; i++) {
                      if($scope.probeConfigSelected.probe_acqu_mode_uid === item.probe_acqu_mode_uid){
                        $scope.probeAcquModeSelected = item;
                      }
                  }
              }
              else if($scope.probeAcquModeSelected === undefined ||
               $scope.probeAcquModeSelected_uid === -1){
                $scope.probeAcquModeSelected = $scope.probeAcquMode[$scope.probeAcquMode.length-1];
              }
              $scope.probeAcquModeSelected_uid = $scope.probeAcquModeSelected.probe_acqu_mode_uid;
            }
            else{
              $scope.initProbeAcquModeList();
            }
      });
    };
    $scope.getProbeConfig = function (probeUID){
      Monitoring.getProbeConfig(probeUID)
      .then(function(data){
            if(data.length !== 0){
              $scope.probeConfig = data;
              if($scope.probeConfigSelected === undefined ||
               $scope.probeConfigSelected_uid === -1){
                $scope.probeConfigSelected = $scope.probeConfig[$scope.probeConfig.length-1];
              }
              $scope.probeConfigSelected_uid = $scope.probeConfigSelected.probe_config_uid;
              $scope.getProbeAcquMode();
            }
            else{
              $scope.initProbeConfigList();
            }
      });
    };
    $scope.getProbes = function (){
      Monitoring.getProbes()
      .then(function(data){
          if(data.length !== 0){
            $scope.probes = data;
            if($scope.probeSelected === undefined ||
               $scope.probeSelected_uid === -1){
              $scope.probeSelected = $scope.probes[$scope.probes.length-1];
            }
            $scope.probeSelected_uid = $scope.probeSelected.probe_uid;
            $scope.getProbeConfig($scope.probeSelected_uid);
          }
          else{
            $scope.initProbesList();
          }
      });
    };

    //////////////////////////////////////////
    // Operation on database 
    //////////////////////////////////////////
    $scope.addProbe = function (){
        $scope.probes.concat($scope.newProbe);
        $scope.probeSelected = $scope.newProbe;
        $scope.probeConfigSelected = $scope.newProbeConfig;
        $scope.probeSelected_uid =  $scope.probeSelected.probe_uid;
        $scope.probeConfigSelected_uid =  $scope.probeConfigSelected.probe_config_uid;
        $http.post($scope.serverMonitoring+'monitoring.query?callback=addProbe', $scope.newProbe).then(
          function(response){
            $scope.refresh();
        });
    };

    $scope.updateProbe = function (){
        $http.post($scope.serverMonitoring+'monitoring.query?callback=updateProbe', $scope.probeSelected).then(
          function(response){
            $scope.refresh();
        });
    };

    $scope.rmProbe = function (){
      if($scope.probeSelected_uid){
        $http.get($scope.serverMonitoring+'monitoring.query?callback=rmProbe&probeUID='+$scope.probeSelected_uid).then(
          function(response){
            $scope.probeSelected_uid =  -1;
            $scope.probeConfigSelected_uid =  -1;
            $scope.refresh();
        });
      }
    };

    $scope.addProbeConfig = function (){
        $scope.probeConfig.concat($scope.newProbeConfig);
        $scope.probeConfigSelected = $scope.newProbeConfig;
        $scope.probeConfigSelected_uid =  $scope.probeConfigSelected.probe_config_uid;
        $scope.probeAcquModeSelected = $scope.selectAMode;
        $scope.probeAcquModeSelected_uid = -2;
        $http.post($scope.serverMonitoring+'monitoring.query?callback=addProbeConfig&probeUID='+$scope.probeSelected.probe_uid, $scope.newProbeConfig).then(
          function(response){
            $scope.refresh();
        });
    };

    $scope.updateProbeConfig = function (){
        $http.post($scope.serverMonitoring+'monitoring.query?callback=updateProbeConfig', $scope.probeConfigSelected).then(
          function(response){
            $scope.refresh();
        });
    };

    $scope.rmProbeConfig = function (){
      if($scope.probeConfigSelected_uid){
        $http.get($scope.serverMonitoring+'monitoring.query?callback=rmProbeConfig&probeConfigUID='+$scope.probeConfigSelected_uid).then(
          function(response){
            $scope.probeConfigSelected_uid =  -1;
            $scope.refresh();
        });
      }
    };

    $scope.addProbeAcquMode = function (){
        $scope.probeAcquMode.concat($scope.newProbeAcquMode);
        $scope.probeAcquModeSelected = $scope.newProbeAcquMode;
        $scope.probeAcquModeSelected_uid = $scope.probeAcquModeSelected.probe_acqu_mode_uid;
        $http.post($scope.serverMonitoring+'monitoring.query?callback=addProbeAcquMode', $scope.newProbeAcquMode).then(
          function(response){
            $scope.refresh();
        });
    };

    $scope.updateProbeAcquMode = function (){
        $http.post($scope.serverMonitoring+'monitoring.query?callback=updateProbeAcquMode', $scope.probeAcquModeSelected).then(
          function(response){
            $scope.refresh();
        });
    };

    $scope.rmProbeAcquMode = function (){
      if($scope.probeAcquModeSelected_uid){
        $http.get($scope.serverMonitoring+'monitoring.query?callback=rmProbeAcquMode&probeAcquModeUID='+$scope.probeAcquModeSelected_uid).then(
          function(response){
            $scope.probeAcquModeSelected_uid =  -1;
            $scope.refresh();
        });
      }
    };

    //////////////////////////////////////////
    // Method on user input 
    //////////////////////////////////////////
    $scope.onSelectProbe = function(){
      var item = $scope.probes[0];
      for (var i = 0, item; item = $scope.probes[i]; i++) {
          if($scope.probeSelected_uid === item.probe_uid){
            $scope.probeSelected = item;
          }
      }
      $scope.getProbeConfig($scope.probeSelected_uid);
    };

    $scope.onSelectProbeConfig = function(){
      var item = $scope.probeConfig[0];
      for (var i = 0, item; item = $scope.probeConfig[i]; i++) {
          if($scope.probeConfigSelected_uid === item.probe_config_uid){
            $scope.probeConfigSelected = $scope.probeConfig[i];
          }
      }
      for (var i = 0, item; item = $scope.probeAcquMode[i]; i++) {
          if($scope.probeConfigSelected.probe_acqu_mode_uid === item.probe_acqu_mode_uid){
            $scope.probeAcquModeSelected = $scope.probeAcquMode[i];
            $scope.probeAcquModeSelected_uid = item.probe_acqu_mode_uid;
          }
      }
    };

    $scope.onSelectProbeAcquMode = function(){
      Monitoring.linkAcquModeToConfig($scope.probeAcquModeSelected_uid, $scope.probeConfigSelected_uid);
      var item = $scope.probeAcquMode[0];
      for (var i = 0, item; item = $scope.probeAcquMode[i]; i++) {
          if($scope.probeAcquModeSelected_uid === item.probe_acqu_mode_uid){
            $scope.probeAcquModeSelected = $scope.probeAcquMode[i];
          }
      }
    };

    //////////////////////////////////////////
    // DEBUG function
    //////////////////////////////////////////
    $scope.debug = function (){
          console.log($scope.probeSelected);

    };

    //////////////////////////////////////////
    //Call method to init display
    //////////////////////////////////////////
    $scope.refresh=function(){
        $scope.getProbes();
       // $scope.getProbeAcquMode();
    };
    $scope.initProbesList();
    $scope.initProbeConfigList();
    $scope.initProbeAcquModeList();
    $scope.refresh();
}]);

myAppCtrl.controller('ProbesManagementCtrl', 
        ['Monitoring', 'socket', '$scope', '$http', 
         function(Monitoring, socket, $scope, $http ) {

    //////////////////////////////////////////
    // Init methods
    //////////////////////////////////////////

    $scope.serverMonitoring = "http://localhost:8000/";

    $scope.initProbesManagementList = function(){
      $scope.probeManagementSelected_uid = -1;
      $scope.probeManagementSelected_uid = null;
      $scope.probesManagement = [];
    };

    socket.on('refreshProbes', function(data){
        $scope.refresh();
    });

    $scope.getProbesManagement = function (){
      Monitoring.getProbesManagement()
      .then(function(data){
          $scope.probesManagement = data;
          $scope.probeManagementSelected = $scope.probesManagement[0];
      },
      function(){
          $scope.initProbesManagementList();
      });
    };

    $scope.onClickProbeStatus = function (probe_uid, probe_config_uid, status){
        var data = {
            'probe_uid': probe_uid,
            'probe_config_uid': probe_config_uid,
            'status':!status
        };
        $http.post($scope.serverMonitoring+'monitoring.query?callback=changeProbeStatus', data).then(
          function(response){
            $scope.refresh();
        });
    };

    //////////////////////////////////////////
    //Call method to init display
    //////////////////////////////////////////
    $scope.refresh=function(){
        $scope.getProbesManagement();
    };
    $scope.initProbesManagementList();
    $scope.refresh();
}]);

myAppCtrl.controller('AdminServerCtrl', 
        ['Monitoring', 'socket', '$scope', '$http', '$location', 
         function(Monitoring, socket, $scope, $http, $location ) {

    //////////////////////////////////////////
    // Init methods
    //////////////////////////////////////////
    $scope.config = {};
    Monitoring.getConfig()
    .then(function(data){
        if(data){
          $scope.config = data;
        }
    });

    $scope.onCreateDB=function(){
        $http.get('/monitoring.query?callback=createDB').then(
          function(){
            $scope.serverConnected = true;
            $location.path("/admin_probes");
        });
    };
    
    $scope.onChangeConfigDB=function(){
        Monitoring.setConfig($scope.config)
        .then(function(){
          $scope.serverConnected = true;
          $location.path("/monitoring");
        })
        .catch(function(err){
          $scope.serverConnected = false;
        });
    };
}]);

