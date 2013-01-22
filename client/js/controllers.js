function LobbyCtrl($scope, $rootScope, gameHolder) {
    $rootScope.notify = 'Welcome to Versus Poker!'

    // Animation stuff.
    setTimeout(function() {
        if ($rootScope.firstGame) {
            $('#lobby').addClass('transition-off');
            $('#lobby').css('right', '0px');
            setTimeout(function() {
                $('#lobby').removeClass('transition-off');
            });
        } else {
            $('#lobby').css('right', '0px');
        }
    });

    var playerId, socket;
    $scope.findGame = function() {
        // Connect to the match-making system.
        if (!$rootScope.enableFindGame) {
            return;
        }

        $('#find-game').text('Finding game...').addClass('inactive');
        $rootScope.notify = 'Searching for an opponent...';
        $rootScope.enableFindGame = false;

        socket = io.connect('http://localhost:4001/matchmaking',
                            {'connect timeout': 8000});

        socket.on('connect_failed', function() {
            // Could not connect to server.
            $('#find-game').text('Find Game').removeClass('inactive');
            $rootScope.notify = 'Sorry, the server seems to be down.';
            $rootScope.enableFindGame = true;
        });

        // Server will tell us what our player id is if we don't have one.
        socket.on('assign-player-id', function(data) {
            playerId = data.playerId;
        });

        // Match found, start a game.
        socket.on('match-found', function(data) {
            $rootScope.$apply(function() {
                $rootScope.notify = 'Cards in the air!';
            });

            gameHolder.newGame(data);
            setTimeout(function() {
                $rootScope.view = 'game';
                $rootScope.$apply();
            }, 500);

            // Animation stuff.
            $rootScope.firstGame = false;
            $('#lobby').css('right', '320px');
            $('#loading').css('opacity', '1');
            setTimeout(function() {
                $('#loading').css('opacity', '0');
            }, 600);
        });

        socket.emit('find-match', {playerId: playerId});
    };
}


function PokerCtrl($scope, $rootScope, Socket, gameHolder) {
    setTimeout(function() {
        $('#game').css('left', '0px');
    });

    $scope.checkCallText = function() {
        var gs = $scope.gs;
        var seat = $scope.seat;
        if (!gs || !gs.availableActions) {
            return 'Call';
        } else if (gs.availableActions.indexOf(c.ACTION_CALL) < 0) {
            return 'Check';
        } else if (gs.toCall >= gs.players[seat].chips && gs.actionOn == seat) {
            return 'All In'
        }
        return 'Call';
    };

    $scope.betRaiseText = function() {
        var gs = $scope.gs;
        if (!gs) {
            return 'Raise to';
        }
        for (var i = 0; i < gs.players.length; i++) {
            if (gs.players[i].roundPIP > 0) {
                return 'Raise to';
            }
        }
        return 'Bet';
    };

    $scope.doAction = function(action) {
        // Displays action buttons, gets the one clicked, and sends the
        // action to the server.
        var gs = $scope.gs;
        var seat = $scope.seat;
        if (gs.actionOn != seat) { return; }

        var action;
        switch (action) {
            case 'fold':
                action = {seat: seat, action: c.ACTION_FOLD};
                break;
            case 'checkCall':
                if (gs.availableActions.indexOf(c.ACTION_CHECK) > -1) {
                    action = {seat: seat, action: c.ACTION_CHECK};
                } else {
                    action = {seat: seat, action: c.ACTION_CALL};
                }
                break;
            case 'raise':
                action = {seat: seat, action: c.ACTION_RAISE,
                          amount: $scope.raiseAmount};
                break;
        }
        resetSlider(gs, seat, true);
        $('#slider-fill').attr('value', '');
        Socket.emit('action', {action: action, gs: gs});
    };

    Socket.emit('new-game', gameHolder.gameData());

    sockets($scope, $rootScope, Socket);
}
