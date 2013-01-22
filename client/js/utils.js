function gameOver($scope, $rootScope, disconnect) {
    var msg = '';
    if (disconnect) {
        msg = 'Opponent disconnected. ';
    }
    if ($scope.gs.gameWinner == $scope.seat) {
        msg += 'You won!';
    } else {
        msg += 'You lost.';
    }
    $rootScope.notify = msg;

    // Animation.
    setTimeout(function() {
        $('#game').css('left', '320px');
        $('#loading').css('opacity', '1');
        setTimeout(function() {
            $('#loading').css('opacity', '0');
        }, 600);
    }, 4500);

    // Switch to lobby.
    setTimeout(function() {
       $rootScope.enableFindGame = true;
       $rootScope.view = 'lobby';
       $rootScope.$apply();
    }, 5000);
    setTimeout(function() {
        clearBoard($scope);
    }, 5500);
}


function clearBoard($scope) {
    // Clear the board.
    for (var i = 0; i < 5; i++) {
        $scope.gs.boardCards[i] = null;
    }
    for (var i = 0; i < 2; i++) {
        $scope.gs.players[$scope.opponentSeat][i] = null;
    }
}


function getRank(rank) {
    return {2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
            8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
            14: 'A'}[rank];
}


function getSuit(suit) {
    switch(suit) {
        case 'c': return '&clubs;';
        case 'd': return '&diams;';
        case 'h': return '&hearts;';
        case 's': return '&spades;';
    }
}


function suitColor(suit) {
    switch(suit) {
        case 'c': return 'black';
        case 'd': return 'red';
        case 'h': return 'red';
        case 's': return 'black';
    }
}


function strCard(card) {
    return getRank(card.rank) + card.suit;
}


function resetSlider(gs, seat, zero) {
    setTimeout(function() {
        if (gs.actionOn == seat) {
            $('.bet-slider').attr('value', zero ? gs.minRaiseTo : 0);
            $('.bet-slider').trigger('change');
        } else {
            $('#slider-fill').attr('value', '');
        }
    });
}


function prettyLastAction(history, seat) {
    var highestRound = '0';
    for (var round in history) {
        if (history.hasOwnProperty(round)) {
            if (history[round].length > 0 && round > highestRound) {
                highestRound = round;
            }
        }
    }
    var round = highestRound;
    var lastAction = history[round][history[round].length - 1];

    var msg = '';
    if (lastAction.seat == seat) {
        msg += 'You ';
    } else {
        msg += 'Opponent ';
    }

    msg += c.actions[lastAction.action.action];

    if (lastAction.action.action == c.ACTION_RAISE) {
        msg += ' ' + lastAction.action.amount;
    }
    msg += '.';
    return msg;
}
