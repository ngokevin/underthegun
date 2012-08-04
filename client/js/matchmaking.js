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

        // Start game.
        socket.on('new-game', function(data) {
            console.log(data);
            console.log('Game started!');

            // Start hand.
            socket.on('new-hand', function(data) {
                // Receive hole cards.
                var hole1 = data.hole[0], hole2 = data.hole[1];
                console.log(data.gs);
                console.log('Starting new hand (' + data.hole[0].card + data.hole[1].card + ').');
                $('#hole1').html(data.hole[0].card);
                $('#hole2').html(data.hole[1].card);

                // Preflop betting round.
                if (data.gs.actionOn == d.seat) {
                    getAction('preflop', data);
                }
                socket.on('preflop-action', function(data) {
                    console.log(data);
                    getAction('preflop');
                });
                socket.on('preflop-done', function(data) {
                    // Receive turn.

                    // Turn betting round.
                });
            });

            function getAction() {
                // Displays action buttons, gets the one clicked, and sends the
                // action to the server.
                $('#actions').show().bind('click', function() {
                    var data = {}
                    switch (this.id) {
                        case 'fold':
                            data.action = ['fold', 0];
                            break;
                        case 'call':
                            data.action = ['call', 0];
                            break;
                        case 'bet':
                            data.action = ['bet', 10];
                            break;
                        case 'raise':
                            data.action = ['raise', 10];
                            break;
                    }
                    socket.emit('preflop-action', data)

                    $('#actions').hide().unbind('click');
                });
            }

        });

        // When game over, disconnect and redirect to lobby.
    }
});
