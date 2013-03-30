function sockets($scope, $rootScope, notify, Socket) {
    Socket.on('assign-seat', function(data) {
        $scope.seat = data.seat;
        $scope.opponentSeat = data.seat === 0 ? 1 : 0;
    });

    Socket.on('new-game', function(gs) {
        $scope.gs = gs;
        $scope.$apply();
        initSlider($scope);
    });

    Socket.on('new-hand', function(gs) {
        $scope.gs = gs;
        var hole1 = gs.players[$scope.seat].hole[0];
        var hole2 = gs.players[$scope.seat].hole[1];
        notify('Dealt ' + strCard(hole1) + strCard(hole2));
        resetSlider(gs, $scope.seat, false);
    });

    Socket.on('next-turn', function(gs) {
        $scope.gs = gs;
        notify(lastActionMsg(gs.history, $scope.seat));
        resetSlider(gs, $scope.seat, false);
    });

    Socket.on('hand-complete', function(gs) {
        // Gray out buttons.
        $scope.gs.actionOn = gs.actionOn;
        $scope.gs.availableActions = gs.availableActions;

        // Show cards.
        $scope.gs.players = gs.players;

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
                $scope.$apply(function() {
                    $scope.gs.boardCards[4] = gs.boardCards[4];
                });
            }, delay);
            delay += delayInterval;
        }

        // Don't update chip counts until the all-in sequence is finished.
        setTimeout(function() {
            $scope.gs.players[$scope.opponentSeat].chips = gs.players[$scope.opponentSeat].chips;
            $scope.gs.players[$scope.seat].chips = gs.players[$scope.seat].chips;
            $scope.gs.pot = gs.pot;
        }, gs.winner !== null ? delay: 0);

        // Display winner.
        if (gs.winner !== null) {
            var hand;
            if (gs.winner.hand) {
                hand = c.hands[gs.winner.hand.strength];
            }
            setTimeout(function() {
                if (gs.winner.seat === $scope.seat) {
                    notify('You won with ' + hand + ' and earned $' +
                           gs.pot + '.');
                } else if (gs.winner.seat !== $scope.seat) {
                    notify('You lost to ' + hand + '. Opponent earned $' +
                           gs.pot + '.');
                } else {
                    notify('You both tied the hand. Split pot.');
                }
                $rootScope.$apply();
            }, delay || 0);
        }

        setTimeout(function() {
            Socket.emit('hand-complete', {gs: gs});
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
