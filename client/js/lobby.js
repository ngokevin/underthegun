$(document).ready(lobby);

function lobby() {
    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });

    $('#game').hide();
    $('#lobby').show();
    $('#find-game').text('Find Game').removeClass('inactive');
    notify('Welcome to Versus Poker!');

    // Connect to the match-making system.
    var enableClick = true;
    $('#find-game').click(function() {
        if (!enableClick) { return; }

        var playerId = null;
        var socket = io.connect('http://localhost:3479', {'connect timeout': 1000});

        $('#find-game').text('Finding game...').addClass('inactive');
        socket.emit('find-match', { playerId: playerId });
        notify('Searching for an opponent...');
        enableClick = false;

        socket.on('connect_failed', function() {
            // Could not connect to server.
            $('#find-game').text('Find Game').removeClass('inactive');
            notify('Sorry, the server seems to be down.');
            enableClick = true;
        });

        // Server will tell us what our player id is if we don't have one.
        socket.on('assign-player-id', function(data) {
            playerId = data.playerId;
        });

        // Match found, start a game.
        socket.on('match-found', function(data) {
            game(data.gameId, playerId, data.opponentId, data.seat);
        });
    });
}
