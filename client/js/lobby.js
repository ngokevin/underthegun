$(document).ready(function() {
    playerId = null;
    socket = null;
    enableFindGame = true;
    init();
    lobby();
});

function lobby() {
    $('#game').hide();
    $('#lobby').show();
    $('#find-game').text('Find Game').removeClass('inactive');
    notify('Welcome to Versus Poker!');
    enableFindGame = true;
}

function init() {
    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });

    $('#find-game').click(function() {
        // Connect to the match-making system.
        if (!enableFindGame) {
            return;
        }

        $('#find-game').text('Finding game...').addClass('inactive');
        notify('Searching for an opponent...');
        enableFindGame = false;

        if (!socket) {
            socket = io.connect('http://localhost:4000/matchmaking',
                                {'connect timeout': 1000});

            socket.on('connect_failed', function() {
                // Could not connect to server.
                $('#find-game').text('Find Game').removeClass('inactive');
                notify('Sorry, the server seems to be down.');
                enableFindGame = true;
            });

            // Server will tell us what our player id is if we don't have one.
            socket.on('assign-player-id', function(data) {
                playerId = data.playerId;
            });

            // Match found, start a game.
            socket.on('match-found', function(data) {
                game(data.gameId, playerId, data.opponentId);
            });
        }

        socket.emit('find-match', { playerId: playerId });
    });
}
