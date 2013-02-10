var Game = function ($scope, $rootScope, notify) {
    var gs;

    var newGame = function() {
        $scope.pnp = true;
        gs = new Holdem.Gs();
        gs.addPlayer();
        gs.addPlayer();
        gs.newHand();
        _syncView();
        initSlider($scope);
        _nextTurn();
    };

    var action = function(actionObj) {
        var handStatus = gs.applyAction(actionObj.action);
        if ('next-turn' in handStatus) {
            _nextTurn();
            _pnpOverlay();
        } else if ('hand-complete' in handStatus) {
            if (gs.calcGameWinner() === null) {
                setTimeout(function() {
                    gs.newHand();
                    _syncView();
                }, 6000);
            } else {
                gameOver($scope, $rootScope, notify);
            }
        }
        _syncView();
    };

    var _pnpOverlay= function() {
        $scope.pnpOverlay = true;
        $scope.pnpAction = prettyLastAction(gs.history, $scope.seat);
    };

    var _nextTurn = function() {
        // Switch seats.
        $scope.seat = gs.actionOn;
        $scope.opponentSeat = $scope.seat === 0 ? 1 : 0;
    };

    var _syncView = function() {
        $scope.gs = gs.filter(gs.actionOn);
        $scope.$apply();
    };

    return {
        newGame: newGame,
        action: action,
    };
};