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
        socket.on('new-game', function(gs) {
            console.log('Game started!');

            // Start hand.
            socket.on('new-hand', function(gs) {
                // Receive hole cards.
                var hole1 = gs[d.seat + 'Hole'][0];
                var hole2 = gs[d.seat + 'Hole'][1];
                $('#hole1').html(hole1.card);
                $('#hole2').html(hole2.card);
                console.log('Starting new hand (' + hole1.card + hole2.card + ').');

                // Preflop betting round.
                if (gs.actionOn == d.seat) {
                    getAction('preflop');
                }
                socket.on('preflop-action', function(gs) {
                    getAction('preflop');
                });
                socket.on('preflop-done', function(gs) {
                    // Receive turn.
                    // Turn betting round.
                });

                socket.on('hand-complete', function(gs) {
                    console.log('hand complete');
                });
            });

            function getAction(round) {
                // Displays action buttons, gets the one clicked, and sends the
                // action to the server.
                var actionEvent = round + '-action';
                $('#actions span').removeClass('inactive').bind('click', function() {
                    switch (this.id) {
                        case 'fold':
                            gs[actionEvent].push(['fold', 0]);
                            break;
                        case 'check':
                            gs[actionEvent].push(['check', 0]);
                            break;
                        case 'call':
                            gs[actionEvent].push(['call', 0]);
                            break;
                        case 'bet':
                            gs[actionEvent].push(['bet', 10]);
                            break;
                        case 'raise':
                            gs[actionEvent].push(['raise', 10]);
                            break;
                    }
                    socket.emit(actionEvent, gs)
                    $('#actions span').addClass('inactive').unbind('click');
                });
            }

        });

        // When game over, disconnect and redirect to lobby.
    }
});
