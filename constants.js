(function(exports) {
    exports.ACTION_FOLD = 0;
    exports.ACTION_CHECK = 1;
    exports.ACTION_CALL = 2;
    exports.ACTION_BET = 3;
    exports.ACTION_RAISE = 4;

    exports.action = {
        // Action constants.
        FOLD: 0,
        CHECK: 1,
        CALL: 2,
        BET: 3,
        RAISE: 4,
    };

    exports.actions = {
        0: 'fold',
        1: 'check',
        2: 'call',
        3: 'bet',
        4: 'raise',
    }

    exports.round = {
        // Action constants.
        PREFLOP: 0,
        FLOP: 1,
        TURN: 2,
        RIVER: 3,
    };

    exports.hs = {
        // Hand strength constants.
        HIGH_CARD: 0,
        PAIR: 1,
        TWO_PAIR: 2,
        TRIPS: 3,
        STRAIGHT: 4,
        FLUSH: 5,
        FULL_HOUSE: 6,
        QUADS: 7,
        STRAIGHT_FLUSH: 8
    };
})(typeof exports === 'undefined' ? this['c'] = {} : exports);
