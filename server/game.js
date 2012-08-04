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
var clients = {}, hands = {};

var io = require('socket.io').listen(http);
io.sockets.on('connection', function(socket) {
    var seat;

    // Shared game state of a hand.
    var gs = {
        seat1Id: null,
        seat2Id: null,
        button: 'seat1',
        smallBlind: 10,
        bigBlind: 20,
        seat1Chips: 1500,
        seat2Chips: 1500,
        pot: 30,
        flop1: null,
        flop2: null,
        flop3: null,
        turn: null,
        river: null,
        actionOn: 'seat1',
    }

    socket.on('new-game', function(data) {
        // Set up game.
        if (data.seat == 'seat1') {
            seat = 'seat1';
            gs.seat1Id = data.heroId;
            gs.seat2Id = data.villainId;
        } else {
            seat = 'seat2';
            gs.seat2Id = data.heroId;
            gs.seat1Id = data.villainId;
        }
        clients[data.heroId] = socket;
        socket.emit('new-game', gs);

        // Play game.
        var winner = false;
        while (!winner) {
            // Have the socket in seat1 deal the hand.
            if (seat == 'seat1') {
                hands[gs.seat1Id] = {
                    deck: new holdem.Deck(),
                };
                hands[gs.seat1Id].seat1Hole = hands[gs.seat1Id].deck.draw(2),
                hands[gs.seat1Id].seat2Hole = hands[gs.seat1Id].deck.draw(2),

                socket.emit('new-hand', {gs: gs, hole: hands[gs.seat1Id].seat1Hole});
                clients[gs.seat2Id].emit('new-hand', {gs: gs, hole: hands[gs.seat1Id].seat2Hole});

                socket.on('preflop-action', function(data) {
                    console.log('preflop-action ' + data.action);
                });

                // Swap button.
                var button = button == 'seat1' ? 'seat2' : 'seat1';
            }
            winner = true;
        }
    });

});

function f() { return false; }
console.log('Server running at localhost:8433');
