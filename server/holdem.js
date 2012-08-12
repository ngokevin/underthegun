// Deck Stuff
var Deck = function() {
    this.deck = createDeck();
    this.shuffle();
}
Deck.prototype.draw = function(n) {
    if (!n || n == 1) {
        return this.deck.pop();
    }
    return this.deck.splice(0, n);
}
Deck.prototype.shuffle = function() {
    var tmp, current, top = this.deck.length;

    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = this.deck[current];
        this.deck[current] = this.deck[top];
        this.deck[top] = tmp;
    }

    return this.deck;
}
function createDeck() {
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
    return deck;
}
exports.Deck = Deck;


// Game State Stuff

// Shared game state of a hand.
var Gs = function() {
    this.gameId = null;
    this.seat1Id = null;
    this.seat2Id = null;
    this.deck = new Deck();
    this.button = 'seat1';
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.seat1Chips = 1500;
    this.seat2Chips = 1500;
    this.seat1Hole = [];
    this.seat2Hole = [];
    this.pot = 30;
    this.seat1Pot = 0;
    this.seat2Pot = 0;
    this.currentRound = 'preflop';
    this.flop1 = null;
    this.flop2 = null;
    this.flop3 = null;
    this.turn = null;
    this.river = null;
    this.actionOn = this.button;
    this.preflopActions = [];
    this.flopActions = [];
    this.turnActions = [];
    this.riverActions = [];
    this.winner = null;
}
Gs.prototype.applyAction = function(seat, action) {
    // Parses an action, manipulates the game state and tells the
    // players. Sort of like a finite state machine. Returns true if
    // move onto the next round.
    this[this.currentRound + 'Actions'].push(action);

    switch (action[0]) {
        case 'fold':
            // Next hand if a player folds.
            this.winner = nextPlayer();
            return { 'hand-complete': true };
            break;

        case 'check':
            if (isButton(seat)) {
                // End hand if button checks back river.
                if (this.currentRound == 'river') {
                    // TODO: calculate winner
                    return { 'hand-complete': true };
                // Next round if button checks back round.
                } else {
                    this.nextTurn();
                    return { 'next-round': true };
                }
            // Next turn if player leads with check.
            } else {
                this.nextTurn();
                return { 'next-turn': true };
            }

        case 'call':
            var toCall = this.getSeatAttr(seat, 'Pot') - this.getSeatAttr(nextPlayer(), 'Pot');
            this.subtractChips(seat, 'Chips', toCall);
            this.addChips(seat, 'Pot', toCall);
            this.scoopPot();

            // End hand if player calls river bet.
            if (this.currentRound == 'river') {
                // TODO: calculate winner
                return { 'hand-complete': true };
            // Next round if player calls bet.
            } else {
                this.nextTurn();
                return { 'next-round': true };
            }
            break;

        case 'bet':
            break;

        case 'raise':
            break;
    }
};
Gs.prototype.newHand = function() {
    this.deck.shuffle();
    this.button = nextPlayer(this.button);
    this.pot = this.smallBlind + this.bigBlind;
    this.currentRound = 'preflop';
    this.seat1Hole = [];
    this.seat2Hole = [];
    this.flop1 = null;
    this.flop2 = null;
    this.flop3 = null;
    this.river = null;
    this.actionOn = this.button;
    this.currentBet = 0;
    this.preflopActions = [];
    this.flopActions = [];
    this.turnActions = [];
    this.riverActions = [];
    this.winner = null;
};
Gs.prototype.filter = function(seat) {
    // Hide certain values based on seat (for security reasons so they can't
    // snoop other player's hole cards.
    var filterKeys = [otherPlayer(seat) + 'Hole', 'deck'];
    var filteredGs = {}
    for(var keys = Object.keys(this), l = keys.length; l; --l) {
        if (filterKeys.indexOf(keys[l-1]) < 0) {
            filteredGs[ keys[l-1] ] = this[ keys[l-1] ];
        }
    }
    return filteredGs;
};
Gs.prototype.isButton = function(seat) {
    return seat == this.button ? true : false;
};
Gs.prototype.nextTurn = function() {
    // Switch turn to next player (action on other player).
    this.actionOn = nextPlayer(this.actionOn);
};
Gs.prototype.getSeatAttr = function(seat, attr) {
    return this[seat + attr];
};
Gs.prototype.setSeatAttr = function(seat, attr, val) {
    this[seat + attr] = val;
};
Gs.prototype.subtract = function(seat, attr, chips) {
    this[seat + attr] -= chips;
};
Gs.prototype.add = function(seat, attr, chips) {
    this[seat + attr] += chips;
};
Gs.prototype.scoopPot = function() {
    this.pot += this.seat1Pot + this.seat2Pot;
    this.seat1Pot = 0;
    this.seat2Pot = 0;
}
function otherPlayer(seat) {
    // Get other player.
    return seat == 'seat1' ? 'seat2' : 'seat1';
}
function nextPlayer() {
    // Get other player.
    return this.actionOn == 'seat1' ? 'seat2' : 'seat1';
}
exports.Gs = Gs;
