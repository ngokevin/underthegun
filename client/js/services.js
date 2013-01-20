angular.module('poker-app.services', []).factory('gameHolder', function() {
    var _gameData;
    return {
        gameData: function() {
            return _gameData;
        },
        newGame: function(gameData) {
            _gameData = gameData;
        }
    }
}).factory('Socket', function($rootScope) {
    var socket = io.connect('http://localhost:4001/game');

    // Override socket.on to $apply the changes to angular.
    return {
        on: function(eventName, fn) {
            socket.removeAllListeners(eventName);
            socket.on(eventName, function(gs) {
                $rootScope.$apply(function() {
                    fn(gs);
                });
            });
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    };
})
