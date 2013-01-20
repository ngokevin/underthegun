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
    notify(msg);
    setTimeout(function() {
        $('#game').css('left', '320px');
    }, 4500);
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


var notBar = $('#not-bar');
function notify(msg) {
    notBar.text(msg);
}
