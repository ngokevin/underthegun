function game(gameId, playerId, opponentId, seat) {
    notify('Cards in the air!');
    $('#lobby').hide();
    $('#game').show();

    var socket = io.connect('http://localhost:8433');

    socket.emit('new-game', { gameId: gameId, playerId: playerId, opponentId: opponentId });

    socket.on('assign-seat', function(data) {
        seat = data.seat;
    });

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
            updateValues(gs);

            // Clear the board.
            $('#board-cards .card').addClass('undealt').text('');

            // Receive hole cards.
            var hole1 = gs.players[seat].hole[0];
            var hole2 = gs.players[seat].hole[1];
            $('#hole1').html(prettyCard(hole1.card));
            $('#hole2').html(prettyCard(hole2.card));

            notify('Dealt ' + hole1.card + hole2.card);
            getAction(gs.currentRound, gs);  // Button preflop.
        });

        // Betting rounds.
        socket.on('next-turn', function(gs) {
            updateValues(gs);
            getAction(gs.currentRound, gs);  // Big blind preflop, button post-flop.
        });

        socket.on('next-round', function(gs) {
            updateValues(gs);
            getAction(gs.currentRound, gs);
        });

        socket.on('hand-complete', function(gs) {
            var wait = updateValues(gs);
            setTimeout(function() {
                socket.emit('hand-complete', {gs: gs})
            }, wait || 0);
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
                        action = {seat: seat, action: c.ACTION_FOLD, amount: 0};
                        break;
                    case c.ACTION_CHECK:
                        action = {seat: seat, action: c.ACTION_CHECK, amount: 0};
                        break;
                    case c.ACTION_CALL:
                        action = {seat: seat, action: c.ACTION_CALL, amount: 0};
                        break;
                    case c.ACTION_BET:
                        action = {seat: seat, action: c.ACTION_BET, amount: betAmount};
                        break;
                    case c.ACTION_RAISE:
                        action = {seat: seat, action: c.ACTION_RAISE, amount: betAmount};
                        break;
                }
                socket.emit('action', {action: action, gs: gs})
                enabledButtons.addClass('inactive').unbind('click');
            });
        }

        function updateValues(gs) {
            // Update DOM values according to game state.
            $('#bet-slider').slider({
                min: gs.minRaiseTo,
                value: gs.minRaiseTo,
                max: gs.players[seat].chips + gs.pot
            });

            // Button position.
            if (gs.button == seat) {
                $('.pkr-button').hide();
                $('#button').show();
            } else {
                $('.pkr-button').hide();
                $('#opponent-button').show();
            }

            // Call amount.
            if (gs.availableActions.indexOf(c.ACTION_CALL) > -1 && gs.actionOn == seat) {
                $('#call-amount').text(gs.toCall);
            } else {
                $('#call-amount').empty();
            }

            // Opponent hole cards.
            for (var i = 0; i < gs.players.length; i++) {
                if (i != seat && 'hole' in gs.players[i]) {
                    var hole = gs.players[i].hole;
                    $('#opponentHole1').html(prettyCard(hole[0].card)).removeClass('facedown');
                    $('#opponentHole2').html(prettyCard(hole[1].card)).removeClass('facedown');
                }
            }

            // Board cards.
            var delayInterval = 3000;
            var delay = 0;  // Set delays for all-in sequence.
            if ($('.flop').hasClass('undealt') && gs.boardCards.length >= 3) {
                $('#flop1').html(prettyCard(gs.boardCards[0].card));
                $('#flop2').html(prettyCard(gs.boardCards[1].card));
                $('#flop3').html(prettyCard(gs.boardCards[2].card));
                $('.flop').removeClass('undealt');
                delay += delayInterval;
            }
            if ($('#turn').hasClass('undealt') && gs.boardCards.length >= 4) {
                setTimeout(function() {
                    $('#turn').html(prettyCard(gs.boardCards[3].card)).removeClass('undealt');
                }, delay);
                delay += delayInterval;
            }
            if ($('#river').hasClass('undealt') && gs.boardCards.length == 5) {
                setTimeout(function() {
                    $('#river').html(prettyCard(gs.boardCards[4].card)).removeClass('undealt');
                }, delay);
                delay += delayInterval;
            }

            // Don't update chip counts if until the all-in sequence is finish.
            setTimeout(function() {
                $('#opponent-chips').text(gs.players[seat == 0 ? 1 : 0].chips);
                $('#pot').text(gs.pot);
                $('#chips').text(gs.players[seat].chips);
            }, gs.winner !== null ? delay: 0);

            // Display winner.
            if (gs.winner !== null) {
                setTimeout(function() {
                    if (gs.winner == seat) {
                        notify('You won the hand and earned ' + gs.pot + ' chips.');
                    } else if (gs.winner !== null) {
                        notify('You lost the hand. Opponent won ' + gs.pot + ' chips.');
                    } else {
                        notify('You both tied the hand. Split pot.');
                    }
                }, delay);
            }

            return delay;
        }
    });

    function prettyCard(cardStr) {
        var card = '<span class="rank">' + cardStr[0] + '</span>';
        switch (cardStr[1]) {
            case 'c':
                card += '<span class="black-suit">&clubs;</span>';
                break;
            case 'd':
                card += '<span class="red-suit">&diams;</span>';
                break;
            case 'h':
                card += '<span class="red-suit">&hearts;</span>';
                break;
            case 's':
                card += '<span class="black-suit">&spades;</span>';
                break;
        }
        return card;
    }

    // When game over, disconnect and redirect to lobby.
}


String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) {
        return a.toUpperCase();
    });
};
