var Game = function ($scope) {

    function newGame() {
        $scope.pnp = true;
        $scope.gs = new Holdem.Gs();
        $scope.gs.addPlayer();
        $scope.gs.addPlayer();
        $scope.gs.newHand();
        nextTurn();
    }

    function action(actionObj) {
        $scope.gs.applyAction(actionObj.action);
        nextTurn();
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