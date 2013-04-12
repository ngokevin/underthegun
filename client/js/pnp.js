var PNPGame = function ($scope, $rootScope, notify) {
    // Pass-and-play.
    var gs;

    var newGame = function() {
        $scope.pnp = true;
        gs = new Holdem.Gs();
        gs.addPlayer();
        gs.addPlayer();
        _newHand();
        _syncView(true);
        resetSlider($scope, gs);
        _nextTurn();
    };

    var action = function(actionObj) {
        var handStatus = gs.applyAction(actionObj.action);
        if ('next-player' in handStatus) {
            _nextTurn();
            _pnpOverlay();
        } else if ('hand-complete' in handStatus) {
            _handComplete();
        } else if ('all-in' in handStatus) {
            setTimeout(function() {
                // Angular doesn't know about async code, don't want $digest.
                var oldGs = {};
                $.extend(true, oldGs, gs);
                gs.allIn();
                $scope.gs = oldGs;
            });
            setTimeout(function() {
                // Queue all-in UI update before all-in gs update.
                _allIn();
            });
            return;
        }
        _syncView(true);
    };

    function _syncView(noApply) {
        // Updates gs to scope, and applies scope.
        $scope.gs = gs.filter(gs.actionOn);
        if (!noApply) {
            $scope.$apply();
        }
    }

    function _pnpOverlay() {
        // Shows overlay.
        $scope.pnpOverlay = true;
        $scope.pnpAction = lastActionMsg(gs.history, $scope.seat);
    }

    function _newHand() {
        $scope.pnpOverlay = true;
        gs.newHand();
        $scope.pnpAction = 'Player ' + gs.actionOn + '\'s Turn';
        notify("Dealt new hand.");
    }

    function _nextTurn() {
        // Switch seats (effectively rotates window).
        $scope.seat = gs.actionOn;
        $scope.opponentSeat = $scope.seat === 0 ? 1 : 0;
        resetSlider($scope, gs);
    }

    function _handComplete() {
        var delay = showdown($scope, gs, notify);
        if (gs.calcGameWinner() === null) {
            setTimeout(function() {
                _displayWinner();
                _syncView();
            }, delay);
            setTimeout(function() {
                // Pause for a bit, then deal a new hand.
               _newHand();
               _syncView();
            }, delay + 6000);
        } else {
            _gameOver(delay);
        }
    }

    function _allIn() {
        var delay = showdown($scope, gs, notify);
        if (gs.calcGameWinner() !== null) {
            _gameOver(delay);
        }
    }

    function _displayWinner() {
        // Display winner.
        if (gs.winner !== null) {
            var hand;
            if (gs.winner.hand) {
                hand = c.hands[gs.winner.hand.strength];
                if (gs.winner.seat !== -1) {
                    notify('Player ' + gs.winner.seat + ' won hand with '+
                            hand + '. ($' + gs.pot + ')');
                } else {
                    notify('You both tied the hand with ' + hand + '.');
                }
            } else {
                var loser = gs.winner.seat === 0 ? 1 : 0;
                notify('Player ' + loser + ' folded. Player ' +
                       gs.winner.seat + ' won $' + gs.pot + '.');
            }
        }
    }

    function _gameOver(delay) {
        setTimeout(function() {
            notify('Player ' + gs.gameWinner + ' won!');
            _syncView();
        }, delay);
        setTimeout(function() {
            toLobby($scope, $rootScope);
        }, delay + 6000);
    }

    return {
        newGame: newGame,
        action: action
    };
};