(function(exports) {
    exports.action = {
        // Action constants.
        FOLD: 0,
        CHECK: 1,
        CALL: 2,
        BET: 3,
        RAISE: 4,
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
})(typeof exports === 'undefined' ? this['Holdem'] = {} : exports);
