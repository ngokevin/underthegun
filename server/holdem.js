exports.deck = function() {
    // Returns a shuffled deck.
    var ranks = [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'],
                 [7, '7'], [8, '8'], [9, '9'], [10, 'T'], [11, 'J'],
                 [12, 'Q'], [13, 'K'], [14, 'A']];
    var suits = ['c', 'd', 'h', 's'];

    var deck = [];
    for (var i=0; i<ranks.length; i++) {
        for (var j=0; j<suits.length; j++) {
            deck.push({
                card: ranks[i][1] + suits[j],
                rank: ranks[i][0],
                suit: suits[j],
                strRank: ranks[i][1]
            });
        }
    }

    return shuffle(deck);
}

function shuffle(array) {
    var tmp, current, top = array.length;

    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array;
}


exports.drawNCards = function(deck, n) {
    if (n == 1) {
        return deck.pop();
    }

    var cards = [];
    for (var i=0; i<n; i++) {
        cards.push(deck.pop());
    }
    return cards;
}
