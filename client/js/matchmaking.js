$(document).ready(function() {
    var d = {
        heroId: null,
        villainId: null,
        seat: null
    }

    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });

    // Connect to the match-making system.
    $('#find-match').click(function() {
        var socket = io.connect('http://localhost:3479');

        // Server will tell us what our player id is if we don't have one.
        socket.on('assign-player-id', function(data) {
            d.heroId = data.heroId;
            console.log('Your player id is ' + d.heroId);
        });

        // Match found, start a game.
        socket.on('match-found', function(data) {
            d.seat = data.seat;
            d.villainId = data.villainId;
            console.log('Player found (' + d.villainId + '), start game.');
            game();
        });

        socket.emit('find-match', { heroId: d.heroId });
        console.log('Looking for match...');

        $(this).unbind('click');
    });


    function game() {
        $('#lobby').hide();
        $('#game').show();

        var socket = io.connect('http://localhost:8433');

        console.log('Starting new game...');
        socket.emit('new-game', d);

        socket.on('new-game', function(data) {
            console.log(data);
            console.log('Game started!');
            socket.on('new-hand', function(data) {
                console.log('Starting new hand.');
            });
        });
    }

});
