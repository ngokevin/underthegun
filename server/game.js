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
    var seat, seat1Id, playerId, gameId, gs;

    socket.on('new-game', function(data) {
        // Set up game.
        seat = data.seat;
        seat1Id = seat == 'seat1' ? data.heroId : data.villainId;
        playerId = data.heroId;
        clients[playerId] = socket;

        // Have only one player's socket initialize the game state into the
        // global object.
        if (seat == 'seat1') {
            gs = new holdem.Gs();
            gs.gameId = numGames++;
            gs.seat1Id = data.heroId;
            gs.seat2Id = data.villainId;

            // Store it in a global object so both sockets can access it via
            // the game id (which will be handed out soon).
            gameStates[seat1Id] = gs;

            emitGsAll('new-game');
            newHand();
        }

        socket.on('action', function(data) {
            // TODO: verify game state
            // Tell seat2 where game state is.
            if (!gs) { gs = gameStates[seat1Id]; }

            var handStatus = gs.applyAction(seat, data.action);
            if ('next-turn' in handStatus) {
                emitGsAll('next-turn');
            } else if ('next-round' in handStatus) {
                emitGsAll('next-round');
            } else if ('hand-complete' in handStatus) {
                emitGsAll('hand-complete');
            }
        });

        socket.on('hand-complete', function(data) {
            // TODO: verify game state
            // Tell seat2 where game state is.
            if (!gs) { gs = gameStates[seat1Id]; }

            if (gs.hasGameWinner() === false) {
                newHand();
            }
        });

        function newHand() {
            if (seat == 'seat1') {
                gameStates[seat1Id].newHand();
                gsSet('seat1Hole', gsGet('deck').draw(2));
                gsSet('seat2Hole', gsGet('deck').draw(2));
                emitGsAll('new-hand');
            }
        }

        function emitGsAll(eventName) {
            clients[gs.seat1Id].emit(eventName, gs.filter('seat1'));
            clients[gs.seat2Id].emit(eventName, gs.filter('seat2'));
        }

        // Getter and setters that pulls the correct gamestate keyed off of the
        // first seat's player ID.
        function gsGet(k) {
            return gameStates[seat1Id][k];
        }
        function gsSet(k, v) {
            gameStates[seat1Id][k] = v;
        }
    });
});

function f() { return false; }
console.log('Server running at localhost:8433');
