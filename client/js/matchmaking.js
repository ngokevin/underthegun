$(document).ready(function() {
    var playerId;

    $('#find-match').click(function() {
        var socket = io.connect('http://localhost:3479');

        socket.on('assign-player-id', function(data) {
            playerId = data.playerId;
            console.log('Your player id is ' + playerId);
        });

        socket.on('match-found', function(data) {
            console.log('Player found (' + data.playerId + '), start game.');
        });

        socket.on('find-match-retry', function() {
            console.log('No match found, retrying.');
            setTimeout(function() { socket.emit('find-match-retry', { playerId: playerId }); }, 3000);
        });

        socket.emit('find-match', { playerId: playerId });
        console.log('Looking for match...');
    });

});
