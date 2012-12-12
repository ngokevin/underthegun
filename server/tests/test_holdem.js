var holdem = require('../holdem');
var c = require('../constants');
var h = holdem.Holdem;


var testBetRaise = {
    setUp: function(callback) {
        callback()
    },

    tearDown: function(callback) {
        callback()
    },

    testPreflop: function(test) {
        var gs  = new holdem.Gs();
        gs.addPlayer(0);
        gs.addPlayer(1);
        gs.newHand();

        // Button raise.
        gs.bigBlind = 20;
        test.equal(gs.minRaiseTo, 30);
        gs.applyAction({action: c.ACTION_RAISE, amount: 30});
        test.equal(gs.pot, 50);
        test.equal(gs.toCall, 10);

        // BB reraise.
        test.equal(gs.minRaiseTo, 60);
        test.done()
    },

    testPostflop: function(test) {
        var gs  = new holdem.Gs();
        gs.addPlayer(0);
        gs.addPlayer(1);
        gs.newHand();
        gs.applyAction({action: c.ACTION_CALL});
        gs.applyAction({action: c.ACTION_CHECK});
        test.equal(gs.pot, 40);

        // Small blind bet.
        gs.bigBlind = 20;
        test.equal(gs.minRaiseTo, 20);
        gs.applyAction({action: c.ACTION_BET, amount: 20});
        test.equal(gs.pot, 60);
        test.equal(gs.toCall, 20);

        // BB reraise.
        test.equal(gs.minRaiseTo, 40);
        test.done()
    }
}


var testApplyAction = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        callback();
    },

    testNextRounds: function(test) {
        var gs  = new holdem.Gs();
        gs.addPlayer(0);
        gs.addPlayer(1);
        gs.newHand();

        test.equal(gs.currentRound, c.ROUND_PREFLOP);
        gs.applyAction({action: c.ACTION_CALL, amount: 0});
        test.equal(gs.currentRound, c.ROUND_PREFLOP);
        gs.applyAction({action: c.ACTION_CHECK, amount: 0});

        test.equal(gs.currentRound, c.ROUND_FLOP);
        gs.applyAction({action: c.ACTION_CHECK, amount: 0});
        test.equal(gs.currentRound, c.ROUND_FLOP);
        gs.applyAction({action: c.ACTION_CHECK, amount: 0});

        test.equal(gs.currentRound, c.ROUND_TURN);
        gs.applyAction({action: c.ACTION_CHECK, amount: 0});
        test.equal(gs.currentRound, c.ROUND_TURN);
        gs.applyAction({action: c.ACTION_CHECK, amount: 0});

        test.equal(gs.currentRound, c.ROUND_RIVER);
        gs.applyAction({action: c.ACTION_CHECK, amount: 0});
        test.equal(gs.currentRound, c.ROUND_RIVER);
        gs.applyAction({action: c.ACTION_CHECK, amount: 0});

        test.done();
    },

    testBetAndCall: function(test) {
        var gs  = new holdem.Gs();
        gs.addPlayer(0);
        gs.addPlayer(1);
        gs.newHand();
        gs.applyAction({action: c.ACTION_CALL, amount: 0});
        gs.applyAction({action: c.ACTION_CHECK, amount: 0});

        // Bet subtracts from chip stack.
        var better = gs.actionOn;
        var betterStack = gs.players[better].chips;
        gs.applyAction({action: c.ACTION_BET, amount: 100});

        // Call subtracts from chip stack.
        var caller = gs.actionOn;
        var callerStack = gs.players[caller].chips;
        gs.applyAction({action: c.ACTION_CALL, amount: 0});

        test.equal(gs.players[better].chips, betterStack - 100);
        test.equal(gs.players[caller].chips, callerStack - 100);
        test.done();
    }
};

var testCalcHand = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        callback();
    },

    testHighCard: function(test) {
        var hand = createHand(['Ac', '3d', '5h', '7s', '9c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_HIGH);
        test.done()
    },

    testPair: function(test) {
        var hand = createHand(['Ac', 'Ad', '5h', '7s', '9c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_PAIR);
        test.done()
    },

    testTwoPair: function(test) {
        var hand = createHand(['Ac', 'Ad', '5h', '5s', '9c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_TWO_PAIR);
        test.done()
    },

    testTrips: function(test) {
        var hand = createHand(['Ac', 'Ad', 'Ah', '5s', '9c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_TRIPS);
        test.done()
    },

    testStraight: function(test) {
        var hand = createHand(['2c', '3d', '4h', '5s', '6c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_STRAIGHT);

        // Wheel.
        var hand = createHand(['Ac', '2d', '3h', '4s', '5c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_STRAIGHT);

        // Broadway.
        var hand = createHand(['Tc', 'Jd', 'Qh', 'Ks', 'Ac', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_STRAIGHT);
        test.done()
    },

    testFlush: function(test) {
        var hand = createHand(['Ac', '3c', '5c', '7c', '9c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_FLUSH);
        test.done()
    },

    testFullHouse: function(test) {
        var hand = createHand(['Ac', 'Ad', 'Ah', '5s', '5c', 'Td', 'Qh']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_BOAT);
        test.done()
    },

    testQuads: function(test) {
        var hand = createHand(['Ac', 'Ad', 'Ah', 'As', '5c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_QUADS);
        test.done()
    },

    testStraightFlush: function(test) {
        var hand = createHand(['2c', '3c', '4c', '5c', '6c', 'Td', 'Th']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_STR_FLUSH);

        // Wheel.
        var hand = createHand(['Ad', '2d', '3d', '4d', '5d', 'Th', 'Ts']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_STR_FLUSH);

        // Broadway.
        var hand = createHand(['Th', 'Jh', 'Qh', 'Kh', 'Ah', 'Ts', 'Tc']);
        var hand = h.calcHand(hand);
        test.equal(hand.strength, c.HAND_STR_FLUSH);
        test.done()
    },
};

var testCompareHands = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        callback();
    },

    testHighCard: function(test) {
        var handA = createHand(['Ac', 'Td', '7h', '5s', '2c'], true);
        var handB = createHand(['As', 'Th', '7d', '5c', '3s'], true);
        test.equal(h.compareHands(handA, handB), -1);

        var handA = createHand(['Ac', 'Td', '7h', '5s', '3c'], true);
        var handB = createHand(['As', 'Th', '7d', '5c', '3s'], true);
        test.equal(h.compareHands(handA, handB), 0);

        var handA = createHand(['Ac', 'Td', '7h', '5s', '3c'], true);
        var handB = createHand(['As', '9h', '7d', '5c', '3s'], true);
        test.equal(h.compareHands(handA, handB), 1);

        test.done()
    },

    testPair: function(test) {
        var handA = createHand(['Ac', 'Ad', '7h', '5s', '2c'], true);
        var handB = createHand(['As', 'Ah', '7d', '5c', '3s'], true);
        test.equal(h.compareHands(handA, handB), -1);

        var handA = createHand(['Kc', 'Kd', '7h', '5s', '2c'], true);
        var handB = createHand(['Ks', 'Kh', '7d', '5c', '2s'], true);
        test.equal(h.compareHands(handA, handB), 0);

        var handA = createHand(['Ac', 'Ad', '7h', '5s', '2c'], true);
        var handB = createHand(['Js', 'Jh', '7d', '5c', '3s'], true);
        test.equal(h.compareHands(handA, handB), 1);

        test.done()
    },

    testTwoPair: function(test) {
        var handA = createHand(['Tc', 'Td', '5h', '5s', 'Ac'], true);
        var handB = createHand(['Js', 'Jh', '3d', '3c', '2s'], true);
        test.equal(h.compareHands(handA, handB), -1);

        var handA = createHand(['4c', '4d', '3h', '3s', 'Ac'], true);
        var handB = createHand(['4s', '4h', '3d', '3c', 'As'], true);
        test.equal(h.compareHands(handA, handB), 0);

        var handA = createHand(['Tc', 'Td', '5h', '5s', 'Ac'], true);
        var handB = createHand(['Ts', 'Th', '5d', '5c', 'Ks'], true);
        test.equal(h.compareHands(handA, handB), 1);

        test.done()
    },

    testTrips: function(test) {
        var handA = createHand(['Tc', 'Td', 'Th', 'As', 'Kc'], true);
        var handB = createHand(['Js', 'Jh', 'Jd', '3c', '2s'], true);
        test.equal(h.compareHands(handA, handB), -1);

        var handA = createHand(['3c', '3d', '3h', '4s', '5c'], true);
        var handB = createHand(['2s', '2h', '2d', 'Qc', 'Js'], true);
        test.equal(h.compareHands(handA, handB), 1);

        test.done()
    },

    testStraight: function(test) {
        var handA = createHand(['Ac', '2d', '3h', '4s', '5c'], true);
        var handB = createHand(['Ts', 'Jh', 'Qd', 'Kc', 'As'], true);
        test.equal(h.compareHands(handA, handB), -1);

        var handA = createHand(['6c', '7d', '8h', '9s', 'Tc'], true);
        var handB = createHand(['6c', '7d', '8h', '9h', 'Td'], true);
        test.equal(h.compareHands(handA, handB), 0);

        test.done()
    },

    testFlush: function(test) {
        var handA = createHand(['Ac', 'Tc', '7c', '5c', '2c'], true);
        var handB = createHand(['Ac', 'Tc', '7c', '5c', '3c'], true);
        test.equal(h.compareHands(handA, handB), -1);

        var handA = createHand(['Ah', 'Th', '7h', '5h', '3h'], true);
        var handB = createHand(['Ah', 'Th', '7h', '5h', '3h'], true);
        test.equal(h.compareHands(handA, handB), 0);

        var handA = createHand(['As', 'Ts', '7s', '5s', '3s'], true);
        var handB = createHand(['As', '9s', '7s', '5s', '3s'], true);
        test.equal(h.compareHands(handA, handB), 1);

        test.done()
    },

    testFullHouse: function(test) {
        var handA = createHand(['Ac', 'Ad', 'Ah', '2s', '2c'], true);
        var handB = createHand(['Ac', 'Ad', 'Ah', '7c', '7s'], true);
        test.equal(h.compareHands(handA, handB), -1);

        var handA = createHand(['Ac', 'Ad', 'Ah', '2s', '2c'], true);
        var handB = createHand(['Ks', 'Kh', 'Kd', 'Qc', 'Qs'], true);
        test.equal(h.compareHands(handA, handB), 1);

        test.done()
    },

    testQuads: function(test) {
        var handA = createHand(['Ac', 'Ad', 'Ah', 'As', 'Kc'], true);
        var handB = createHand(['Kc', 'Kd', 'Kh', 'Kc', 'As'], true);
        test.equal(h.compareHands(handA, handB), 1);

        test.done()
    },
};

function createHand(cards, withStrength) {
    // List of rank-suits (['4s', 'Kd']) to list of Cards.
    var ranks = {'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
                 '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14};

    var hand = [];
    for (var i = 0; i < cards.length; i++) {
        hand.push({
            card: cards[i],
            rank: ranks[cards[i][0]],
            suit: cards[i][1], strRank: cards[i][0]
        });
    }

    // Also calculate handStrength if specified, five-card hand only.
    if (withStrength) {
        return h.getHandStrength(hand);
    } else {
        return hand;
    }
}

// Decide what tests to run.
var tests = {
    testApplyAction: testApplyAction,
    testCalcHand: testCalcHand,
    testCompareHands: testCompareHands,
    testBetRaise: testBetRaise
};
for (var i in tests) {
    exports[i] = tests[i];
}
