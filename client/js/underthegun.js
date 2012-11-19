$(document).ready(function() {
    var gameId = null
    var playerId = null;
    var opponentId = null;
    var seat = null;

    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });

    var notBar = $('#not-bar');
    function notify(msg) {
        notBar.text(msg);
    }
    notify('Welcome to Under the Gun!');

    // Connect to the match-making system.
    $('#find-game').click(function() {
        var socket = io.connect('http://localhost:3479');

        $('#find-game').text('Finding game...').addClass('inactive');

        // Server will tell us what our player id is if we don't have one.
        socket.on('assign-player-id', function(data) {
            playerId = data.playerId;
        });

        // Match found, start a game.
        socket.on('match-found', function(data) {
            seat = data.seat;
            opponentId = data.opponentId;
            game();
        });

        socket.emit('find-match', { playerId: playerId });
        notify('Searching for an opponent...');

        $(this).unbind('click');
    });


    function game() {
        notify('Cards in the air!');
        $('#lobby').hide();
        $('#game').show();

        var socket = io.connect('http://localhost:8433');

        socket.on('assign-seat', function(data) {
            seat = data.seat;
        });

        socket.emit('new-game', { gameId: gameId, playerId: playerId, opponentId: opponentId, seat: seat });

        // Start game.
        socket.on('new-game', function(gs) {
            // Initialize bet slider.
            var betAmount = gs.bigBlind;
            function updateBetAmount(amount) {
                betAmount = amount;
                $('#bet-amount').text(amount);
            }
            $('#bet-slider').slider({
                min: gs.pot + gs.bigBlind, max: gs.players[seat].chips, value: gs.bigBlind, step: 1,
                slide: function(e, ui) { updateBetAmount(ui.value) },
                change: function(e, ui) { updateBetAmount(ui.value) },
                stop: function(e, ui) { updateBetAmount(ui.value) }
            });
            updateBetAmount(gs.pot + gs.bigBlind);

            // Start hand.
            socket.on('new-hand', function(gs) {
                console.log(gs);
                console.log(seat);

                // Clear the board.
                $('#board-cards .card').addClass('undealt').text('');

                // Receive hole cards.
                var hole1 = gs.players[seat].hole[0];
                var hole2 = gs.players[seat].hole[1];
                $('#hole1').html(hole1.card);
                $('#hole2').html(hole2.card);

                notify('Dealt ' + hole1.card + hole2.card);
                updateValues(gs);
                getAction(gs.currentRound, gs);  // Button preflop.
            });
            // Betting rounds.
            socket.on('next-turn', function(gs) {
                updateValues(gs);
                getAction(gs.currentRound, gs);  // Big blind preflop, button post-flop.
            });
            socket.on('next-round', function(gs) {
                switch (gs.currentRound) {
                    case c.ROUND_FLOP:
                        $('#flop1').text(gs.boardCards[0].card);
                        $('#flop2').text(gs.boardCards[1].card);
                        $('#flop3').text(gs.boardCards[2].card);
                        $('.flop').removeClass('undealt');
                        break;
                    case c.ROUND_TURN: $('#turn').text(gs.boardCards[3].card).removeClass('undealt'); break;
                    case c.ROUND_RIVER:
                        $('#river').text(gs.boardCards[4].card).removeClass('undealt');
                        break;
                }

                updateValues(gs);
                getAction(gs.currentRound, gs);  // Big blind.
            });

            socket.on('hand-complete', function(gs) {
                if (gs.winner == seat) {
                    notify('You won the hand and earned ' + gs.pot + ' chips.');
                } else if (gs.winner) {
                    notify('You lost the hand. Opponent won ' + gs.pot + ' chips.');
                } else {
                    notify('You both tied the hand. Split pot.');
                }
                updateValues(gs);
                socket.emit('hand-complete', {gs: gs})
            });

            function getAction(round, gs) {
                // Displays action buttons, gets the one clicked, and sends the
                // action to the server.
                if (gs.actionOn != seat) { return; }
                var action;

                var enabledButtons = $();
                $(gs.availableActions).each(function(index, action) {
                    // From available actions, enable the respective buttons.
                    actionButtons = $('#actions span.' + c.actions[action]);
                    enabledButtons = enabledButtons.add(actionButtons.data('action', action));

                    var buttonText = c.actions[action];
                    if (action == c.ACTION_RAISE) { buttonText += ' to'; }
                    actionButtons.find('.action').text(buttonText);
                });

                enabledButtons.removeClass('inactive').bind('click', function() {
                    switch ($(this).data('action')) {
                        case c.ACTION_FOLD:
                            action = {action: c.ACTION_FOLD, amount: 0};
                            break;
                        case c.ACTION_CHECK:
                            action = {action: c.ACTION_CHECK, amount: 0};
                            break;
                        case c.ACTION_CALL:
                            action = {action: c.ACTION_CALL, amount: 0};
                            break;
                        case c.ACTION_BET:
                            action = {action: c.ACTION_BET, amount: betAmount};
                            break;
                        case c.ACTION_RAISE:
                            action = {action: c.ACTION_RAISE, amount: betAmount};
                            break;
                    }
                    socket.emit('action', {action: action, gs: gs})
                    enabledButtons.addClass('inactive').unbind('click');
                });
            }

            function updateValues(gs) {
                $('#pot').text(gs.pot);
                $('#round').text(gs.currentRound);
            }
        });

        // When game over, disconnect and redirect to lobby.
    }
});
