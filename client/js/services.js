angular.module('poker-app.services', []).factory('gameHolder', function() {
    var _gameData;
    return {
        gameData: function() {
            return _gameData;
        },
        newGame: function(gameData) {
            _gameData = gameData;
        }
    };
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
}).factory('pubsub', function() {
    var cache = {};
    return {
        publish: function(topic, args) {
            cache[topic] && $.each(cache[topic], function() {
                this.apply(null, args || []);
            });
        },
        subscribe: function(topic, callback) {
            if (!cache[topic]) {
                cache[topic] = [];
            }
            cache[topic].push(callback);
            return [topic, callback];
        },
        unsubscribe: function(handle) {
            var t = handle[0];
            cache[t] && $.each(cache[t], function(idx){
                if (this == handle[1]) {
                    cache[t].splice(idx, 1);
                }
            });
        }
    };
}).factory('notify', function($rootScope) {
    return function(msg) {
        $rootScope.notify = msg;
    };
});