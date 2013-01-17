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
            localCard: '@card',
        },
        link: function(scope, element, attrs) {
            scope.$watch('localCard', function(card) {
                if (card) {
                    var card = JSON.parse(card);
                    scope.rank = getRank(card.rank);
                    scope.suit = getSuit(card.suit);
                    scope.suitColor = suitColor(card.suit);
                }
            });
        },
    };
});


function PokerCtrl($scope, Socket, gameHolder) {

    $scope.checkCallText = function() {
        var gs = $scope.gs;
        if (!gs || !gs.availableActions) {
            return 'Call';
        } else if (gs.availableActions.indexOf(c.actions[c.ACTION_FOLD]) > -1) {
            return 'Fold';
        } else if (gs.toCall >= gs.players[$scope.seat].chips) {
            return 'All In'
        }
        return 'Call';
    };

    $scope.betRaiseText = function() {
        var gs = $scope.gs;
        if (!gs) {
            return 'Raise to';
        }
        for (var i = 0; i < gs.players.length; i++) {
            if (gs.players[i].roundPIP > 0) {
                return 'Raise to';
            }
        }
        return 'Bet';
    };

    $scope.doAction = function(action) {
        // Displays action buttons, gets the one clicked, and sends the
        // action to the server.
        var gs = $scope.gs;
        var seat = $scope.seat;
        if (gs.actionOn != seat) { return; }

        var action;
        switch (action) {
            case 'fold':
                action = {seat: seat, action: c.ACTION_FOLD};
                break;
            case 'checkCall':
                if (gs.availableActions.indexOf(c.ACTION_CHECK) > -1) {
                    action = {seat: seat, action: c.ACTION_CHECK};
                } else {
                    action = {seat: seat, action: c.ACTION_CALL};
                }
                break;
            case 'raise':
                action = {seat: seat, action: c.ACTION_RAISE,
                          amount: $scope.raiseAmount};
                break;
        }
        Socket.emit('action', {action: action, gs: gs});
    };

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
        // var wait = updateValues(gs);
        // setTimeout(function() {
        //     Socket.emit('hand-complete', {gs: gs})
        // }, wait || 0);
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
