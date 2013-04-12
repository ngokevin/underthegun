function sockets($scope, $rootScope, notify, Socket) {
    Socket.on('assign-seat', function(data) {
        $scope.seat = data.seat;
        $scope.opponentSeat = data.seat === 0 ? 1 : 0;
    });

    Socket.on('new-game', function(gs) {
        $scope.gs = gs;
        resetSlider($scope, gs);
    });

    Socket.on('new-hand', function(gs) {
        $scope.gs = gs;
        var hole1 = gs.players[$scope.seat].hole[0];
        var hole2 = gs.players[$scope.seat].hole[1];
        notify('Dealt ' + strCard(hole1) + strCard(hole2));
        resetSlider($scope, gs);
    });

    Socket.on('next-turn', function(gs) {
        $scope.gs = gs;
        notify(lastActionMsg(gs.history, $scope.seat));
        resetSlider($scope, gs);
    });

    Socket.on('hand-complete', function(gs) {
        var delay = showdown($scope, gs, notify);
        $scope.activeBtns(gs);
        setTimeout(function() {
            $rootScope.$apply(function() {
                _displayWinner(delay, gs);
            });
        }, delay);

        setTimeout(function() {
            Socket.emit('hand-complete', {gs: gs});
            $scope.gs = gs;
        }, delay || 0);
    });

    Socket.on('game-over', function(gs) {
        $scope.gs = gs;
        _gameOver(false);
    });

    Socket.on('game-over-dc', function(gs) {
        $scope.gs = gs;
        _gameOver(true);
    });

    function _gameOver(disconnnect) {
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

        toLobby($scope, $rootScope);
    }

    function _displayWinner(delay, gs) {
        // Display winner.
        if (gs.winner !== null) {
            var hand;
            if (gs.winner.hand) {
                hand = c.hands[gs.winner.hand.strength];
                if (gs.winner.seat === $scope.seat) {
                    notify('You won with ' + hand + ' and earned $' +
                           gs.pot + '.');
                } else if (gs.winner.seat !== $scope.seat) {
                    notify('You lost to ' + hand + '. Opponent earned $' +
                           gs.pot + '.');
                } else {
                    notify('You both tied the hand. Split pot.');
                }
            } else {
                if (gs.winner.seat === $scope.seat) {
                    notify('Opponent folded. ($' + gs.pot + ')');
                } else if (gs.winner.seat !== $scope.seat) {
                    notify('You folded. Opponent won $' + gs.pot + '.');
                }
            }
        }
    }
}
