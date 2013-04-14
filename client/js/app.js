'use strict';

var pokerApp = angular.module('poker-app',['poker-app.directives',
                                           'poker-app.services'])
.run(function($rootScope) {
    $rootScope.enableFindGame = true;
});

$(document).ready(function() {
    setTimeout(function() {
        $('.card.logo').addClass('transform');
    }, 100);
});