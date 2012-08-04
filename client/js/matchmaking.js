$(document).ready(function() {
    var playerId;

    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });

    // Connect to the match-making system.
    $('#find-match').click(function() {
        var socket = io.connect('http://localhost:3479');

        // Server will tell us what our player id is if we don't have one.
        socket.on('assign-player-id', function(data) {
            playerId = data.playerId;
            console.log('Your player id is ' + playerId);
        });

        // Match found, start a game.
        socket.on('match-found', function(data) {
            console.log('Player found (' + data.matchId + '), start game.');
            game();
        });

        // Match not found so keep polling until a match is found.
        socket.on('find-match-retry', function() {
            setTimeout(function() { socket.emit('find-match-retry', { playerId: playerId }); }, 3000);
        });

        socket.emit('find-match', { playerId: playerId });
        console.log('Looking for match...');
    });


    function game() {
        $('#lobby').hide();
        $('#game').show();

        socket.on('new-game', function(data) {
            console.log('Starting new game.');

            socket.on('new-hand', function(data) {
                console.log('Starting new hand.');
            });
        });
    }

});
