module.exports = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        callback();
    },

    test1: function(test) {
        console.log(createHand(['As', '3s', '4s', '5s', '6s', '7s']));
        test.done()
    }

};

function createHand(cards) {
    // List of rank-suits (['4s', 'Kd']) to list of Cards.
    var ranks = {'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
                 '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14};

    var hand = [];
    for (var i = 0; i < cards.length; i++) {
        hand.push({
            card: cards[i],
            rank: ranks[cards[i][0]],
            suit: cards[i][1],
            strRank: cards[i][0]
        });
    }
    return hand;
}
