'use strict';
var pokerApp = angular.module('poker-app', []);


pokerApp.run(function($rootScope) {
    $rootScope.enableFindGame = true;
});


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

                    scope.undealt = false;
                    scope.facedown = false;
                } else {
                    scope.rank = '';
                    scope.suit = '';
                    if ('hole' in attrs) {
                        scope.facedown = true;
                    } else {
                        scope.undealt = true;
                    }
                }
            });
        },
    };
});


function PokerCtrl($scope, $rootScope, Socket, gameHolder) {

    $scope.checkCallText = function() {
        var gs = $scope.gs;
        var seat = $scope.seat;
        if (!gs || !gs.availableActions) {
            return 'Call';
        } else if (gs.toCall >= gs.players[seat].chips && gs.actionOn == seat) {
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

    sockets($scope, $rootScope, Socket);
    $rootScope.socketBinded = true;

}


function gameOver($scope, $rootScope, disconnect) {
    var msg = '';
    if (disconnect) {
        msg = 'Opponent disconnected. ';
    }
    if ($scope.gs.gameWinner == $scope.seat) {
        msg += 'You won!';
    } else {
        msg += 'You lost.';
    }
    notify(msg);
    setTimeout(function() {
       $rootScope.enableFindGame = true;
       $rootScope.view = 'lobby';
       $rootScope.$apply();
    }, 5000);
    setTimeout(function() {
        clearBoard($scope);
    }, 5500);
}


function sockets($scope, $rootScope, Socket) {
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
            });
        setTimeout(function() {
            $('.bet-slider').trigger('change');
        });
    });

    Socket.on('new-hand', function(gs) {
        $scope.gs = gs;
        var hole1 = gs.players[$scope.seat].hole[0];
        var hole2 = gs.players[$scope.seat].hole[1];
        notify('Dealt ' + strCard(hole1) + strCard(hole2));
    });

    Socket.on('next-turn', function(gs) {
        $scope.gs = gs;
    });

    Socket.on('next-round', function(gs) {
        $scope.gs = gs;
    });

    Socket.on('all-in', function(gs) {
        $scope.gs = gs;
    });

    Socket.on('hand-complete', function(gs) {
        var delayInterval = 2000;
        var delay = 0;  // Set delays for all-in sequence.
        if ($scope.gs.boardCards.length < 3 && gs.boardCards.length >= 3) {
            for (var i = 0; i < 3; i++) {
                $scope.gs.boardCards[i] = gs.boardCards[i];
            }
            delay += delayInterval;
        }
        if (!$scope.gs.boardCards[3] && gs.boardCards.length >= 4) {
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.gs.boardCards[3] = gs.boardCards[3];
                });
            }, delay);
            delay += delayInterval;
        }
        if (!$scope.gs.boardCards[4] && gs.boardCards.length >= 5) {
            setTimeout(function() {
                $scope.gs.boardCards[4] = gs.boardCards[4];
                $scope.$apply(function() {
                    $scope.gs.boardCards[4] = gs.boardCards[4];
                });
            }, delay);
            delay += delayInterval;
        }

        // Don't update chip counts until the all-in sequence is finish.
        setTimeout(function() {
            $scope.gs.players[$scope.opponentSeat].chips = gs.players[$scope.opponentSeat].chips;
            $scope.gs.players[$scope.seat].chips = gs.players[$scope.seat].chips;
            $scope.gs.pot = gs.pot;
        }, gs.winner !== null ? delay: 0);

        // Display winner.
        if (gs.winner !== null) {
            setTimeout(function() {
                if (gs.winner == $scope.seat) {
                    notify('You won the hand and earned ' + gs.pot + ' chips.');
                } else if (gs.winner !== -1) {
                    notify('You lost the hand. Opponent won ' + gs.pot + ' chips.');
                } else {
                    notify('You both tied the hand. Split pot.');
                }
            }, delay);
        }

        setTimeout(function() {
            Socket.emit('hand-complete', {gs: gs})
            $scope.gs = gs;
        }, delay || 0);
    });

    Socket.on('game-over', function(gs) {
        $scope.gs = gs;
        gameOver($scope, $rootScope);
    });

    Socket.on('game-over-dc', function(gs) {
        $scope.gs = gs;
        gameOver($scope, $rootScope, true);
    });
}


function LobbyCtrl($scope, $rootScope, gameHolder) {
    $scope.findGame = function() {
        // Connect to the match-making system.
        if (!$rootScope.enableFindGame) {
            return;
        }

        $('#find-game').text('Finding game...').addClass('inactive');
        notify('Searching for an opponent...');
        $rootScope.enableFindGame = false;

        if (!socket) {
            socket = io.connect('http://localhost:4001/matchmaking',
                                {'connect timeout': 8000});

            socket.on('connect_failed', function() {
                // Could not connect to server.
                $('#find-game').text('Find Game').removeClass('inactive');
                notify('Sorry, the server seems to be down.');
                $rootScope.enableFindGame = true;
            });

            // Server will tell us what our player id is if we don't have one.
            socket.on('assign-player-id', function(data) {
                playerId = data.playerId;
            });

            // Match found, start a game.
            socket.on('match-found', function(data) {
                gameHolder.newGame(data);
                $rootScope.view = 'game';
                $rootScope.$apply();
            });
        }

        socket.emit('find-match', { playerId: playerId });
    };
}


function clearBoard($scope) {
    // Clear the board.
    for (var i = 0; i < 5; i++) {
        $scope.gs.boardCards[i] = null;
    }
    for (var i = 0; i < 2; i++) {
        $scope.gs.players[$scope.opponentSeat][i] = null;
    }
}


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
        case 's': return '&spades;';
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


function strCard(card) {
    return getRank(card.rank) + card.suit;
}
