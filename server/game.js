// Start up hand server.
var http = require('http').createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Hello World');
}).listen(8433);

// Connect to DB.
//var mysql = require("db-mysql");
//new mysql.Database({
//    "hostname": "localhost",
//    "user": "root",
//    "password": "yoursql",
//    "database": "underthegun"
//}).connect(function(error) {
//    if (error) {
//        return console.log('Database connection error: ' + error);
//    }
//});

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
        // Set up game state.
        clients[data.playerId] = socket;

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

        socket.on('action', function(data) {
            // TODO: verify game state
            var handStatus = gs.applyAction(data.action);
            if ('next-turn' in handStatus) {
                emitGsAll('next-turn');
            } else if ('next-round' in handStatus) {
                emitGsAll('next-round');
            } else if ('hand-complete' in handStatus) {
                emitGsAll('hand-complete');
            } else if ('all-in' in handStatus) {
                emitGsAll('all-in');
                gs.allIn();
                emitGsAll('hand-complete');
            }
        });

        socket.on('hand-complete', function(data) {
            // TODO: verify game state
            if (seat == 0) {
                // Only one player's socket needs to initiate new hand.
                if (gs.calcGameWinner() === null) {
                    setTimeout(newHand, 6000);
                } else {
                    emitGsAll('game-over');
                }
            }
        });

        socket.on('disconnect', function() {
            gs.gameWinner = gs.getNextPlayer(seat);
            emitGsAll('game-over-dc');
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
    });
});

function f() { return false; }
console.log('Server running at localhost:8433');
