$(document).ready(function() {
    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });

    notify('Welcome to Under the Gun!');

    // Connect to the match-making system.
    $('#find-game').click(function() {
        var playerId = null;
        var socket = io.connect('http://localhost:3479');

        $('#find-game').text('Finding game...').addClass('inactive');

        // Server will tell us what our player id is if we don't have one.
        socket.on('assign-player-id', function(data) {
            playerId = data.playerId;
        });

        // Match found, start a game.
        socket.on('match-found', function(data) {
            game(data.gameId, playerId, data.opponentId, data.seat);
        });

        socket.emit('find-match', { playerId: playerId });
        notify('Searching for an opponent...');

        $(this).unbind('click');
    });
});
