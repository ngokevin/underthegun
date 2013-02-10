var Game = function ($scope, $rootScope, notify) {
    var gs;

    var newGame = function() {
        $scope.pnp = true;
        gs = new Holdem.Gs();
        gs.addPlayer();
        gs.addPlayer();
        gs.newHand();
        syncView();
        nextTurn();
    };

    var action = function(actionObj) {
        var handStatus = gs.applyAction(actionObj.action);
        if ('next-turn' in handStatus) {
            nextTurn();
        } else if ('hand-complete' in handStatus) {
            if (gs.calcGameWinner() === null) {
                setTimeout(function() {
                    gs.newHand();
                    syncView();
                }, 6000);
            } else {
                gameOver($scope, $rootScope, notify);
            }
        }
        syncView();
    };

    var nextTurn = function() {
        // Switch seats.
        $scope.seat = gs.actionOn;
        $scope.opponentSeat = $scope.seat === 0 ? 1 : 0;
    };

    var syncView = function() {
        $scope.gs = gs.filter(gs.actionOn);
        $scope.$apply();
    };

    return {
        newGame: newGame,
        action: action,
    };
};