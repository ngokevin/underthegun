var h = require('../holdem').Holdem;

module.exports = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        callback();
    },

    testHighCard: function(test) {
        var hand = createHand(['Ac', '3d', '5h', '7s', '9c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.HIGH_CARD);
        test.done()
    },

    testPair: function(test) {
        var hand = createHand(['Ac', 'Ad', '5h', '7s', '9c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.PAIR);
        test.done()
    },

    testTwoPair: function(test) {
        var hand = createHand(['Ac', 'Ad', '5h', '5s', '9c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.TWO_PAIR);
        test.done()
    },

    testTrips: function(test) {
        var hand = createHand(['Ac', 'Ad', 'Ah', '5s', '9c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.TRIPS);
        test.done()
    },

    testStraight: function(test) {
        var hand = createHand(['2c', '3d', '4h', '5s', '6c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.STRAIGHT);

        // Wheel.
        var hand = createHand(['Ac', '2d', '3h', '4s', '5c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.STRAIGHT);

        // Broadway.
        var hand = createHand(['Tc', 'Jd', 'Qh', 'Ks', 'Ac', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.STRAIGHT);
        test.done()
    },

    testFlush: function(test) {
        var hand = createHand(['Ac', '3c', '5c', '7c', '9c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.FLUSH);
        test.done()
    },

    testFullHouse: function(test) {
        var hand = createHand(['Ac', 'Ad', 'Ah', '5s', '5c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.FULL_HOUSE);
        test.done()
    },

    testQuads: function(test) {
        var hand = createHand(['Ac', 'Ad', 'Ah', 'As', '5c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.QUADS);
        test.done()
    },

    testStraightFlush: function(test) {
        var hand = createHand(['2c', '3c', '4c', '5c', '6c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.STRAIGHT_FLUSH);

        // Wheel.
        var hand = createHand(['Ad', '2d', '3d', '4d', '5d', 'Th', 'Ts']);
        var hand = h.calcHand(hand);
        console.log(hand);
        test.equal(hand.strength, h.hs.STRAIGHT_FLUSH);

        // Broadway.
        var hand = createHand(['Th', 'Jh', 'Qh', 'Kh', 'Ah', 'Ts', 'Tc']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, h.hs.STRAIGHT_FLUSH);
        test.done()
    },
};

function createHand(cards) {
    // List of rank-suits (['4s', 'Kd']) to list of Cards.
    var ranks = {'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
                 '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14};

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
