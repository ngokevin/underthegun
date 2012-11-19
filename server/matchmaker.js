// Start up match-making server.
var http = require('http').createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Hello World');
}).listen(3479);

// Connect to DB.
var mysql = require("db-mysql");
new mysql.Database({
    "hostname": "localhost",
    "user": "root",
    "password": "yoursql",
    "database": "underthegun"
}).connect(function(error) {
    if (error) {
        return console.log('Database connection error: ' + error);
    }
});

// Global vars.
var numPlayers = 0;
var numGames = 0;
var clients = [];

var io = require('socket.io').listen(http);
io.sockets.on('connection', function(socket) {
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
        var index = clients.indexOf(playerId);
        clients.splice(index, index);
    });

});

function f() { return false; }
console.log('Server running at localhost:3479');
