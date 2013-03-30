var PNPGame = function ($scope, $rootScope, notify) {
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
            _nextTurn();
            gs.allIn();
            _handComplete();
        }
        _syncView(true);
    };

    var _pnpOverlay= function() {
        $scope.pnpOverlay = true;
        $scope.pnpAction = lastActionMsg(gs.history, $scope.seat);
    };

    var _nextTurn = function() {
        // Switch seats.
        $scope.seat = gs.actionOn;
        $scope.opponentSeat = $scope.seat === 0 ? 1 : 0;
    };

    var _handComplete = function() {
        handComplete($scope, gs);
        if (gs.calcGameWinner() === null) {
            if (gs.winner) {
                notify('Player ' + gs.winner.seat + ' won hand with ' +
                       c.hands[gs.winner.hand.strength]);
            }
            setTimeout(function() {
                gs.newHand();
                _syncView();
            }, 6000);
        } else {
            gameOver($scope, $rootScope, notify);
        }
    };

    var _syncView = function(noApply) {
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