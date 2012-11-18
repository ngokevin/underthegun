// Start up hand server.
var http = require('http').createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Hello World');
}).listen(8433);

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

var holdem = require('./holdem');

// Global vars. Games and hands hold games/hands in progress which should then
// be saved to DB on completion.
var clients = {};
var gameStates = {}
var numGames = 0;

var io = require('socket.io').listen(http);
io.sockets.on('connection', function(socket) {
    var seat, gs;

    socket.on('new-game', function(data) {
        // Set up game.
        seat = data.seat;
        clients[data.playerId] = socket;

        if (!(data.gameId in gameStates)) {
            // First player's socket to get here sets up the game state.
            gs = new holdem.Gs(data.gameId);
            gs.addPlayer(new holdem.Player(data.playerId));
            gs.addPlayer(new holdem.Player(data.opponentId));

            // Store it in a global object so both sockets can access it via
            // the gameId.
            gameStates[data.gameId] = gs;

            emitGsAll('new-game');
            newHand();
        } else {
            // Other player's socket already set up game state.
            gs = gameStates[data.gameId];
        }

        socket.on('action', function(data) {
            // TODO: verify game state
            var handStatus = gs.applyAction(seat, data.action);
            if ('next-turn' in handStatus) {
                emitGsAll('next-turn');
            } else if ('next-round' in handStatus) {
                emitGsll('next-round');
            } else if ('hand-complete' in handStatus) {
                emitGsAll('hand-complete');
            }
        });

        socket.on('hand-complete', function(data) {
            // TODO: verify game state
            if (gs.hasGameWinner() === false) {

                // Only one player's socket needs to initiate new hand.
                if (seat == 0) {
                    setTimeout(newHand, 12000);
                }
            }
        });

        function newHand() {
            gs.newHand();
            emitGsAll('new-hand');
        }

        function emitGsAll(eventName) {
            for (var i = 0; i < gs.players.length; i++) {
                clients[gs.players[i]].emit(eventName, gs.filter(i));
            }
        }
    });
});

function f() { return false; }
console.log('Server running at localhost:8433');
