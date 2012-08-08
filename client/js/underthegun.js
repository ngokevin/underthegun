$(document).ready(function() {
    var heroId = null;
    var villainId = null;
    var seat = null;

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
            seat = data.seat;
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
        socket.emit('new-game', { heroId: heroId, villainId: villainId, seat: seat });

        // Start game.
        socket.on('new-game', function(gs) {
            console.log('Game started!');

            // Start hand.
            socket.on('new-hand', function(gs) {
                // Receive hole cards.
                var hole1 = gs[seat + 'Hole'][0];
                var hole2 = gs[seat + 'Hole'][1];
                $('#hole1').html(hole1.card);
                $('#hole2').html(hole2.card);
                console.log('Starting new hand (' + hole1.card + hole2.card + ').');

                // Preflop betting round.
                console.log(gs);
                if (gs.actionOn == seat) {
                    getAction('preflop', gs);
                }
                socket.on('preflop-action', function(gs) {
                    getAction('preflop', gs);
                });
                socket.on('preflop-done', function(gs) {
                    // Receive turn.
                    // Turn betting round.
                });

                socket.on('hand-complete', function(gs) {
                    console.log('hand complete');
                });
            });

            function getAction(round, gs) {
                // Displays action buttons, gets the one clicked, and sends the
                // action to the server.
                var action;
                $('#actions span').removeClass('inactive').bind('click', function() {
                    switch (this.id) {
                        case 'fold':
                            action = ['fold', 0];
                            break;
                        case 'check':
                            action = ['check', 0];
                            break;
                        case 'call':
                            action = ['call', 0];
                            break;
                        case 'bet':
                            action = ['bet', 10];
                            break;
                        case 'raise':
                            action = ['raise', 10];
                            break;
                    }
                    socket.emit(round + '-action', {action: action, gs: gs})
                    $('#actions span').addClass('inactive').unbind('click');
                });
            }
        });
        // When game over, disconnect and redirect to lobby.
    }
});
