function LobbyCtrl($scope, $rootScope, notify, pubsub) {
    notify('Welcome to Versus Poker!');

    setTimeout(function() {
        $('.card.logo').addClass('transform');
    }, 100);

    var playerId, socket;
    $scope.findGame = function() {
        // Connect to the match-making system.
        if (!$rootScope.enableFindGame) {
            return;
        }
        $rootScope.enableFindGame = false;
        notify('Searching for an opponent...');
        if (!socket) {
            socket = io.connect('http://localhost:4001/matchmaking',
                                {'connect timeout': 8000});

            socket.on('connect_failed', function() {
                // Could not connect to server.
                notify('Sorry, the server seems to be down.');
                $rootScope.enableFindGame = true;
            });

            // Server will tell us what our player id is if we don't have one.
            socket.on('assign-player-id', function(data) {
                playerId = data.playerId;
            });

            // Match found, start a game.
            socket.on('match-found', function(data) {
                notify('Cards in the air!');
                pubsub.publish('new-game', [data]);
                $rootScope.gameView = true;
                $rootScope.$apply();
            });
        }
        socket.emit('find-match', {playerId: playerId});
    };

    $scope.pnpGame = function() {
        // Local pass and play game.
        notify('Cards in the air!');
        pubsub.publish('new-game-pnp');
        $rootScope.gameView = true;
    };
}


function PokerCtrl($scope, $rootScope, notify, pubsub, Socket) {
    var socketsInitialized;
    pubsub.subscribe('new-game', function(data) {
        $scope.pnp = false;
        Socket.emit('new-game', data);
        if (!socketsInitialized) {
            sockets($scope, $rootScope, notify, Socket);
        } else {
            $socketsInitialized = true;
        }
    });

    var game;
    pubsub.subscribe('new-game-pnp', function() {
        // Game loop.
        game = PNPGame($scope, $rootScope, notify);
        game.newGame();
    });

    $scope.$watch('gs', function(gs) {
        // Watchers on the game state that require some calculations.
        if (!gs) {
            return;
        }
        $scope.activeBtns(gs);

        var seat = $scope.seat;
        $scope.maxRaiseTo = gs.players[seat].chips + gs.players[seat].roundPIP;
    });

    $scope.activeBtns = function(gs) {
        var prereqActive = gs.actionOn == $scope.seat ||
                           ($scope.pnp && !$scope.pnpOverlay);

        $scope.foldActive = (prereqActive &&
            gs.availableActions.indexOf(c.ACTION_FOLD) > -1);

        $scope.callActive = (prereqActive &&
            (gs.availableActions.indexOf(c.ACTION_CHECK) > -1 ||
             gs.availableActions.indexOf(c.ACTION_CALL) > -1));

        $scope.raiseActive = (prereqActive &&
            gs.availableActions.indexOf(c.ACTION_RAISE) > -1);
    };

    $scope.checkCallText = function() {
        var gs = $scope.gs;
        var seat = $scope.seat;
        if (!gs || !gs.availableActions) {
            return 'Call';
        } else if (gs.availableActions.indexOf(c.ACTION_CALL) < 0) {
            return 'Check';
        } else if (seat >= 0 && gs.toCall >= gs.players[seat].chips &&
                   gs.actionOn == seat) {
            return 'All In';
        }
        return 'Call';
    };

    $scope.betRaiseText = function(raiseBtn) {
        // Changes text of button [bet, raise, all-in] depending on context.
        var gs = $scope.gs;
        var seat = $scope.seat;
        // Default.
        var raiseText = raiseBtn ? ' to' : '';
        if (!gs) {
            return 'Raise';
        }
        // All-in.
        if ($scope.raiseAmount >= gs.players[seat].chips +
                                  gs.players[seat].roundPIP &&
            raiseBtn) {
            return 'All-in';
        }
        // Raise.
        for (var i = 0; i < gs.players.length; i++) {
            if (gs.players[i].roundPIP > 0) {
                return 'Raise' + raiseText;
            }
        }
        // Bet.
        return 'Bet';
    };

    $scope.doAction = function(btnAction) {
        // Displays action buttons, gets the one clicked, and sends the
        // action to the server.
        var gs = $scope.gs;
        var seat = $scope.seat;
        if (gs.actionOn != seat) { return; }

        var action;
        switch (btnAction) {
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
        $scope.raiseOverlay = false;
        if ($scope.pnp) {
            game.action({action: action});
        } else {
            Socket.emit('action', {action: action, gs: gs});
        }
    };

    $scope.toggleRaiseOverlay = function() {
        if ($scope.raiseOverlay) {
            $scope.raiseOverlay = false;
            return;
        }
        if ($scope.raiseActive) {
            $scope.raiseOverlay = true;
        }
    }
}
