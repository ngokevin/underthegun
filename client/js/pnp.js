var PNPGame = function ($scope, $rootScope, notify) {
    // Pass-and-play.
    var gs;

    var newGame = function() {
        $scope.pnp = true;
        gs = new Holdem.Gs();
        gs.addPlayer();
        gs.addPlayer();
        gs.newHand();
        _syncView(true);
        initSlider($scope);
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

    var _pnpOverlay= function() {
        // Shows overlay.
        $scope.pnpOverlay = true;
        $scope.pnpAction = lastActionMsg(gs.history, $scope.seat);
    };

    var _nextTurn = function() {
        // Switch seats (effectively rotates window).
        $scope.seat = gs.actionOn;
        $scope.opponentSeat = $scope.seat === 0 ? 1 : 0;
    };

    var _handComplete = function() {
        showdown($scope, gs, notify);
        if (gs.calcGameWinner() === null) {
            // Next hand.
            if (gs.winner) {
                msg = 'Player ' + gs.winner.seat + ' won hand';
                if (gs.winner.hand) {
                    msg += ' with ' + c.hands[gs.winner.hand.strength];
                }
                notify(msg + '.');
            }
            setTimeout(function() {
                // Pause for a bit, then deal a new hand.
                gs.newHand();
                _syncView();
            }, 6000);
        } else {
            gameOver($scope, $rootScope, notify);
        }
    };

    var _allIn = function() {
        var delay = showdown($scope, gs, notify);
        if (gs.calcGameWinner() !== null) {
            setTimeout(function() {
                gameOver($scope, $rootScope, notify);
            }, delay);
        }
    };

    var _syncView = function(noApply) {
        // Updates gs to scope, and applies scope.
        $scope.gs = gs.filter(gs.actionOn);
        if (!noApply) {
            $scope.$apply();
        }
    };

    return {
        newGame: newGame,
        action: action
    };
};