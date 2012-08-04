// Start up match-making server.
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
var clients = {}, games = {}, hands = {};

var io = require('socket.io').listen(http);
io.sockets.on('connection', function(socket) {
    var seat;
    var g = {
        seat1: null, seat2: null
    }

    socket.on('new-game', function(data) {
        // Set up game.
        if (data.seat == 'seat1') {
            seat = 'seat1';
            g.seat1 = data.heroId;
            g.seat2 = data.villainId;
            games[g.seat1] = g;
        } else {
            seat = 'seat2';
            g.seat2 = data.heroId;
            g.seat1 = data.villainId;
        }
        clients[data.heroId] = socket;
        socket.emit('new-game', g);

        // Play game.
        var winner = false;
        while (!winner) {
            // Only have one 'socket' initialize the deck (using seat numbers).
            // This is sort of akin to having seat1 deal every round.
            if (seat == 'seat1') {
                hands.seat1 = { 'deck': holdem.deck() };
            }
            winner = true;
        }
    });

});

function f() { return false; }
console.log('Server running at localhost:8433');
