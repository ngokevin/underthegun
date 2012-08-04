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
var numPlayers = 0, waitingPlayers = [], matchFoundQueue = {};

var io = require('socket.io').listen(http);
io.sockets.on('connection', function(socket) {
    var playerId;

    // Try to find a match, and add to waiting list if can't find one.
    socket.on('find-match', function(data) {
        // Assign a player id to player if they don't have one.
        if (!('playerId' in data)) {
            playerId = numPlayers;
            socket.emit('assign-player-id', { playerId: playerId });
            numPlayers++;
        } else {
            playerId = data.playerId;
        }
        findMatch(playerId, false);
    });

    // Find a match knowing the player is already in the waiting list.
    socket.on('find-match-retry', function(data) {
        findMatch(data.playerId, true);
    });

    // Remove player from waiting list if disconnected.
    socket.on('disconnect', function() {
        var index = waitingPlayers.indexOf(playerId);
        waitingPlayers.splice(index, index);
    });

    function findMatch(playerId, retrying) {
        // Match a player if there's already player waiting.
        if (!retrying && waitingPlayers.length > 0) {
            var matchId = waitingPlayers.shift();
            matchFoundQueue[matchId] = playerId;
            return socket.emit('match-found', { matchId: matchId });
        // Else, join the waiting list and retry.
        } else if (!retrying) {
            waitingPlayers.push(playerId);
        // If retrying, check if someone matched up with the player while the
        // player was waiting.
        } else {
            if (playerId in matchFoundQueue) {
                return socket.emit('match-found', { matchId: matchFoundQueue[playerId] });
            }
        }
        socket.emit('find-match-retry');
    }
});

function f() { return false; }
console.log('Server running at localhost:3479');
