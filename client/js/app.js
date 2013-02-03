'use strict';

var pokerApp = angular.module('poker-app',['poker-app.directives',
                                           'poker-app.services'])
.run(function($rootScope) {
    $rootScope.enableFindGame = true;
});

$(document).ready(function() {
    var ar = new Array(33, 34, 35, 36, 37, 38, 39, 40);
    $(document).keydown(function(e) {
         var key = e.which;
          //console.log(key);
          //if(key==35 || key == 36 || key == 37 || key == 39)
          if ($.inArray(key,ar) > -1) {
              e.preventDefault();
              return false;
          }
          return true;
    });
});