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

var io = require('socket.io').listen(http);
function f() { return false; }

var numPlayers = 0, waitingPlayers = [];
io.sockets.on('connection', function(socket) {
    var playerId;

    function findMatch(playerId, retrying) {
        // Pop player if there's a player waiting.
        if (!retrying && waitingPlayers.length > 0) {
            return socket.emit('match-found', { playerId: waitingPlayers.shift() });
        } else if (!retrying) {
            waitingPlayers.push(playerId);
        }
        socket.emit('find-match-retry');
    }

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

    socket.on('find-match-retry', function(data) {
        findMatch(data.playerId, true);
    });

    socket.on('disconnect', function() {
        var index = waitingPlayers.indexOf(playerId);
        waitingPlayers.splice(index, index);
    });
});

console.log('Server running at localhost:3479');
