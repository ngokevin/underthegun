// Global vars.
var numPlayers = 0;
var numGames = 0;
var clients = [];


exports.matchmaker = function(socket) {
    // On connection.
    var playerId;

    // Try to find a match, and add to waiting list if can't find one.
    socket.on('find-match', function(data) {
        // Assign a player id to player if they don't have one.
        if (data.playerId === null) {
            playerId = numPlayers++;
            socket.set('playerId', playerId, f);
            socket.emit('assign-player-id', { playerId: playerId });
        } else {
            playerId = data.playerId;
            socket.set('playerId', playerId, f);
        }

        // Match a player if there's already player waiting.
        if (clients.length > 0) {
            var waitingPlayer = clients.shift();  // Pop a player from the queue.

            var gameId = numGames++;
            waitingPlayer.get('playerId', function(err, waitingPlayerId) {
                socket.emit('match-found', { gameId: gameId, opponentId: waitingPlayerId })
            });
            waitingPlayer.emit('match-found', { gameId: gameId, opponentId: playerId });
        } else {
            // Store our socket in the waiting list (with playerId attached to it).
            clients.push(socket);
        }
    });

    // Remove player from waiting list if disconnected.
    socket.on('disconnect', function() {
        var index = clients.indexOf(socket);
        clients.splice(index, 1);
    });
}


function f() { return false; }
