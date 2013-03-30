function sockets($scope, $rootScope, notify, Socket) {
    Socket.on('assign-seat', function(data) {
        $scope.seat = data.seat;
        $scope.opponentSeat = data.seat === 0 ? 1 : 0;
    });

    Socket.on('new-game', function(gs) {
        $scope.gs = gs;
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
        var delay = showdown($scope, gs, notify);

        setTimeout(function() {
            Socket.emit('hand-complete', {gs: gs});
            $scope.gs = gs;
        }, delay || 0);

        $rootScope.$apply();
    });

    Socket.on('game-over', function(gs) {
        $scope.gs = gs;
        gameOver($scope, $rootScope, notify);
    });

    Socket.on('game-over-dc', function(gs) {
        $scope.gs = gs;
        gameOver($scope, $rootScope, notify, true);
    });
}
