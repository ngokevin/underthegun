'use strict';
var pokerApp = angular.module('poker-app', []);


pokerApp.factory('gameHolder', function() {
    var _gameData;
    return {
        gameData: function() {
            return _gameData;
        },
        newGame: function(gameData) {
            _gameData = gameData;
        }
    }
});


pokerApp.factory('Socket', function($rootScope) {
    var socket = io.connect('http://localhost:4001/game');

    // Override socket.on to $apply the changes to angular.
    return {
        on: function(eventName, fn) {
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


function getRank(rank) {
    return {2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
            8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
            14: 'A'}[rank];
}
function getSuit(suit) {
    switch(suit) {
        case 'c': return '&clubs;';
        case 'd': return '&diams;';
        case 'h': return '&hearts;';
        case 's': return '&clubs;';
    }
}
function suitColor(suit) {
    switch(suit) {
        case 'c': return 'black';
        case 'd': return 'red';
        case 'h': return 'red';
        case 's': return 'black';
    }
}


pokerApp.directive('card', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'card.html',
        scope: {
            localRank: '@rank',
            localSuit: '@suit',
        },
        link: function(scope, element, attrs) {
            scope.$watch('localRank', function(rank) {
                scope.rank = getRank(rank);
            });
            scope.$watch('localSuit', function(suit) {
                scope.suit = getSuit(suit);
                scope.suitColor = suitColor(suit);
            });
        },
    };
});


function PokerCtrl($scope, $location, Socket, gameHolder) {

    Socket.emit('new-game', gameHolder.gameData());

    Socket.on('assign-seat', function(data) {
        $scope.seat = data.seat;
        $scope.opponentSeat = data.seat == 0 ? 1 : 0;
    });

    Socket.on('new-game', function(gs) {
        $scope.gs = gs;
        $scope.$apply();

        $('.bet-slider').slider()
            .on('change', function() {
                $scope.raiseAmount = $('.bet-slider').attr('value');
                $scope.$apply();
            }).trigger('change');
    });

    Socket.on('new-hand', function(gs) {
        $scope.gs = gs;
        getAndEmitAction(gs, socket);
    });

    Socket.on('next-turn', function(gs) {
        $scope.gs = gs;
        getAndEmitAction(gs, Socket);
    });

    Socket.on('next-round', function(gs) {
        $scope.gs = gs;
        getAndEmitAction(gs, Socket);
    });

    Socket.on('all-in', function(gs) {
        $scope.gs = gs;
    });

    Socket.on('hand-complete', function(gs) {
        $scope.gs = gs;
        //        var wait = updateValues(gs);
        //        setTimeout(function() {
        //            Socket.emit('hand-complete', {gs: gs})
        //        }, wait || 0);
    });

    Socket.on('game-over', function(gs) {
        gameOver(gs);
    });

    Socket.on('game-over-dc', function(gs) {
        gameOver(gs, true);
    });

    socketBinded = true;
}


function LobbyCtrl($scope, gameHolder) {
    $scope.findGame = function() {
        // Connect to the match-making system.
        if (!enableFindGame) {
            return;
        }

        $('#find-game').text('Finding game...').addClass('inactive');
        notify('Searching for an opponent...');
        enableFindGame = false;

        if (!socket) {
            socket = io.connect('http://localhost:4001/matchmaking',
                                {'connect timeout': 8000});

            socket.on('connect_failed', function() {
                // Could not connect to server.
                $('#find-game').text('Find Game').removeClass('inactive');
                notify('Sorry, the server seems to be down.');
                enableFindGame = true;
            });

            // Server will tell us what our player id is if we don't have one.
            socket.on('assign-player-id', function(data) {
                playerId = data.playerId;
            });

            // Match found, start a game.
            socket.on('match-found', function(data) {
                gameHolder.newGame(data);
                $scope.view = 'game';
                $scope.$apply();
            });
        }

        socket.emit('find-match', { playerId: playerId });
    };
}
