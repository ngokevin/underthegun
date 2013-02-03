var holdem = require('./holdem');


// Global vars. Games and hands hold games in progress.
var clients = {};
var gameStates = {}
var numGames = 0;


exports.game = function(socket) {
    var seat, gs, playerId;

    socket.on('new-game', function(data) {
        // Set up game state.
        if (!data) {
            return;
        }
        playerId = data.playerId;
        clients[playerId] = socket;

        if (!(data.gameId in gameStates)) {
            // First player's socket to get here sets up the game state.
            gs = new holdem.Gs(data.gameId);
            gs.addPlayer(data.playerId);
            gs.addPlayer(data.opponentId);
            for (var i = 0; i < gs.players.length; i++) {
                if (gs.players[i].id == data.playerId) {
                    seat = i;
                    socket.emit('assign-seat', {seat: seat});
                }
            }
            // Store it in a global object so both sockets can access it via
            // the gameId.
            gameStates[data.gameId] = gs;
        } else {
            // Second player's socket initiates the game.
            gs = gameStates[data.gameId];
            for (var i = 0; i < gs.players.length; i++) {
                if (gs.players[i].id == data.playerId) {
                    seat = i;
                    socket.emit('assign-seat', {seat: seat});
                }
            }
            emitGsAll('new-game');
            newHand();
        }
    });

    socket.on('action', function(data) {
        // TODO: verify game state.
        if (gs.actionOn != seat) {
            return;
        }

        var handStatus = gs.applyAction(data.action);
        if ('next-turn' in handStatus) {
            emitGsAll('next-turn');
        } else if ('hand-complete' in handStatus) {
            emitGsAll('hand-complete');
        } else if ('all-in' in handStatus) {
            emitGsAll('all-in');
            gs.allIn();
            emitGsAll('hand-complete');
        }
    });

    socket.on('hand-complete', function(data) {
        // Only one player's socket needs to initiate new hand.
        if (gs.calcGameWinner() === null) {
            // TODO: verify game state
            if (seat == 0) {
                setTimeout(newHand, 6000);
            }
        } else {
            if (seat == 0) {
                emitGsAll('game-over');
                delete gameStates[gs.gameId];
            }
            delete clients[playerId];
        }
    });

    socket.on('disconnect', function() {
        if (gs && gs.gameWinner === null) {
            gs.gameWinner = gs.getNextPlayer(seat);
            emitGsAll('game-over-dc');
            delete gameStates[gs.gameId]
            delete clients[playerId];
        }
    });

    function newHand() {
        gs.newHand();
        emitGsAll('new-hand');
    }

    function emitGsAll(eventName) {
        for (var i = 0; i < gs.players.length; i++) {
            clients[gs.players[i].id].emit(eventName, gs.filter(i));
        }
    }
}


function f() { return false; }
