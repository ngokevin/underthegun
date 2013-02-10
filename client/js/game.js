var Game = function ($scope, $rootScope, notify) {

    function newGame() {
        $scope.pnp = true;
        $scope.gs = new Holdem.Gs();
        $scope.gs.addPlayer();
        $scope.gs.addPlayer();
        $scope.gs.newHand();
        nextTurn();
    }

    function action(actionObj) {
        var handStatus = $scope.gs.applyAction(actionObj.action);
        if ('next-turn' in handStatus) {
            nextTurn();
        } else if ('hand-complete' in handStatus) {
            if ($scope.gs.calcGameWinner === null) {
                setTimeout($scope.gs.newHand(), 6000);
            } else {
                gameOver($scope, $rootScope, notify);
            }
        }
    }

    function nextTurn() {
        // Switch seats.
        $scope.seat = $scope.gs.actionOn;
        $scope.opponentSeat = $scope.seat === 0 ? 1 : 0;
    }

    return {
        newGame: newGame,
        action: action,
    };
};