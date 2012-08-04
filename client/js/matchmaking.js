$(document).ready(function() {
    var heroId, villainId;

    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });

    // Connect to the match-making system.
    $('#find-match').click(function() {
        var socket = io.connect('http://localhost:3479');

        // Server will tell us what our player id is if we don't have one.
        socket.on('assign-player-id', function(data) {
            heroId = data.heroId;
            console.log('Your player id is ' + heroId);
        });

        // Match found, start a game.
        socket.on('match-found', function(data) {
            villainId = data.villainId;
            console.log('Player found (' + villainId + '), start game.');
            game();
        });

        socket.emit('find-match', { heroId: heroId });
        console.log('Looking for match...');

        $(this).unbind('click');
    });


    function game() {
        $('#lobby').hide();
        $('#game').show();

        var socket = io.connect('http://localhost:8433');

        console.log('Starting new game...');
        socket.emit('new-game', { playerId: heroId, villainId: villainId });

        socket.on('new-game', function(data) {
            console.log('Game started!');
            socket.on('new-hand', function(data) {
                console.log('Starting new hand.');
            });
        });
    }

});
