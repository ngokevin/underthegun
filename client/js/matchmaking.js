$(document).ready(function() {
    var playerId;

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
        });

        // Match not found so keep polling until a match is found.
        socket.on('find-match-retry', function() {
            console.log('No match found, retrying.');
            setTimeout(function() { socket.emit('find-match-retry', { playerId: playerId }); }, 3000);
        });

        socket.emit('find-match', { playerId: playerId });
        console.log('Looking for match...');
    });

});
