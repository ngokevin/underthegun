$(document).ready(function() {
    var heroId = null;
    var villainId = null;
    var seat = null;

    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });

    // Connect to the match-making system.
    $('#find-game').click(function() {
        var socket = io.connect('http://localhost:3479');

        $('#find-game').text('Finding game...').addClass('inactive');

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

            // Initialize bet slider.
            var betAmount = gs.bigBlind;
            function updateBetAmount(amount) {
                betAmount = amount;
                $('#bet-amount').text('$' + amount);
            }
            $('#bet-slider').slider({
                min: gs.bigBlind, max: gs[seat + 'Chips'], value: gs.bigBlind, step: 1,
                slide: function(e, ui) { updateBetAmount(ui.value) },
                change: function(e, ui) { updateBetAmount(ui.value) },
                stop: function(e, ui) { updateBetAmount(ui.value) }
            });
            updateBetAmount(gs.bigBlind);

            // Start hand.
            socket.on('new-hand', function(gs) {
                // Receive hole cards.
                var hole1 = gs[seat + 'Hole'][0];
                var hole2 = gs[seat + 'Hole'][1];
                $('#hole1').html(hole1.card);
                $('#hole2').html(hole2.card);
                console.log('Starting new hand (' + hole1.card + hole2.card + ').');

                getAction(gs.currentRound, gs);  // Button preflop.
            });
            // Betting rounds.
            socket.on('next-turn', function(gs) {
                console.log('next-turn');
                getAction(gs.currentRound, gs);  // Big blind preflop, button post-flop.
            });
            socket.on('next-round', function(gs) {
                console.log('next-round');
                getAction(gs.currentRound, gs);  // Big blind.
            });
            socket.on('hand-complete', function(gs) {
                console.log('hand complete');
                socket.emit('hand-complete', {gs: gs})
            });

            function getAction(round, gs) {
                // Displays action buttons, gets the one clicked, and sends the
                // action to the server.
                if (gs.actionOn != seat) { return; }
                var action;

                var enabledButtons = $();
                $(gs.availableActions).each(function(index, action) {
                    actionButton = $('#actions span.' + action);
                    enabledButtons = enabledButtons.add(actionButton.data('action', action));

                    if (action == 'raise') { action += ' to'; }
                    actionButton.find('.action').text(action);
                });

                enabledButtons.removeClass('inactive').bind('click', function() {
                    switch ($(this).data('action')) {
                        case 'fold':
                            action = {action: 'fold', amount: 0};
                            break;
                        case 'check':
                            action = {action: 'check', amount: 0};
                            break;
                        case 'call':
                            action = {action: 'call', amount: 0};
                            break;
                        case 'bet':
                            action = {action: 'bet', amount: betAmount};
                            break;
                        case 'raise':
                            action = {action: 'raise', amount: betAmount};
                            break;
                    }
                    socket.emit('action', {action: action, gs: gs})
                    enabledButtons.addClass('inactive').unbind('click');
                });
            }
        });
        // When game over, disconnect and redirect to lobby.
    }
});
