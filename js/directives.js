'use strict';

/* Directives */


angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
  .directive('graph', ['$q', function($q) {
    return {
    	//require: 'ngModel',
        restrict: 'E', // Use as element
        scope: { // Isolate scope
            data: '=', // Two-way bind data to local scope
            opts: '=?' // '?' means optional
        },
        template: "<div></div>", // We need a div to attach graph to
        link: function(scope, elem, attrs, ngModel) {
            if(scope.data[0]){
                scope.graph = new Dygraph(elem.children()[0], scope.data, scope.opts );
            }
            scope.$watch("data", function() {
                if(scope.graph && scope.data[0]){
                    scope.opts.file = scope.data;
                    scope.graph.updateOptions( scope.opts);
                }
                else if(scope.data[0]){
                    scope.graph = new Dygraph(elem.children()[0], scope.data, scope.opts );
                }
            });
            
        }
    };
}]);