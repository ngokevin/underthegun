function gameOver($scope, $rootScope, notify, disconnect) {
    var msg = '';
    if (disconnect) {
        msg = 'Opponent disconnected. ';
    }
    if ($scope.gs.gameWinner == $scope.seat) {
        msg += 'You won!';
    } else {
        msg += 'You lost.';
    }
    notify(msg);

    // Switch to lobby.
    setTimeout(function() {
       $rootScope.enableFindGame = true;
       $rootScope.gameView = false;
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
    for (i = 0; i < 2; i++) {
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


function lastActionMsg(history, seat) {
    var highestRound = '0';
    for (var round in history) {
        if (history.hasOwnProperty(round)) {
            if (history[round].length > 0 && round > highestRound) {
                highestRound = round;
            }
        }
    }
    round = highestRound;
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


function initSlider($scope) {
    $('.bet-slider').slider()
        .on('change', function() {
            $scope.raiseAmount = $('.bet-slider').attr('value');
            $scope.$apply();
        });
    setTimeout(function() {
        $('.bet-slider').trigger('change');
    });
}


function handComplete($scope, gs) {
    // Gray out buttons.
    $scope.gs.actionOn = gs.actionOn;
    $scope.gs.availableActions = gs.availableActions;

    // Show cards.
    $scope.gs.players = gs.players;

    var delayInterval = 2000;
    var delay = 0;  // Set delays for all-in sequence.
    if ($scope.gs.boardCards.length < 3 && gs.boardCards.length >= 3) {
        for (var i = 0; i < 3; i++) {
            $scope.gs.boardCards[i] = gs.boardCards[i];
        }
        delay += delayInterval;
    }
    if (!$scope.gs.boardCards[3] && gs.boardCards.length >= 4) {
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.gs.boardCards[3] = gs.boardCards[3];
            });
        }, delay);
        delay += delayInterval;
    }
    if (!$scope.gs.boardCards[4] && gs.boardCards.length >= 5) {
        setTimeout(function() {
            $scope.gs.boardCards[4] = gs.boardCards[4];
            $scope.$apply(function() {
                $scope.gs.boardCards[4] = gs.boardCards[4];
            });
        }, delay);
        delay += delayInterval;
    }

    // Don't update chip counts until the all-in sequence is finished.
    setTimeout(function() {
        $scope.gs.players[$scope.opponentSeat].chips = gs.players[$scope.opponentSeat].chips;
        $scope.gs.players[$scope.seat].chips = gs.players[$scope.seat].chips;
        $scope.gs.pot = gs.pot;
    }, gs.winner !== null ? delay: 0);
}