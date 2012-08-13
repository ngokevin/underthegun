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
    this.availableActions = [];
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
    if (!this.availableActions[action[0]]) {
        return { 'error': true}
    }

    switch (action[0]) {
        case 'fold':
            // Next hand if a player folds.
            this.winner = nextPlayer();
            return { 'hand-complete': true };
            break;

        case 'check':
            if (isButton(seat)) {
                if (this.currentRound == 'river') {
                    // End hand if button checks back river.
                    return { 'hand-complete': true };
                } else {
                    // Next round if button checks back round.
                    this.nextRound();
                    this.availableActions = ['fold', 'check', 'bet'];
                    return { 'next-round': true };
                }
            } else {
                // Next turn if player leads with check or big blind checks.
                this.nextTurn();
                this.availableActions = ['fold', 'check', 'bet'];
                return { 'next-turn': true };
            }

        case 'call':
            // Add the call to the pot.
            var toCall = this[nextPlayer() + 'Pot'] - this[seat + 'Pot'];
            this.subtractChips(seat, 'Chips', toCall);
            this.addChips(seat, 'Pot', toCall);
            this.pot += toCall;

            if (this.currentRound == 'preflop' && isButton(seat) && this[seat + 'Pot'] == this.bigBlind) {
                // If button limps preflop.
                this.nextTurn();
                this.availableActions = ['fold', 'check', 'raise'];
                return { 'next-turn': true };
            } else if (this.currentRound == 'river') {
                // End hand if player calls river bet.
                return { 'hand-complete': true };
            } else {
                // Next round if player calls bet.
                this.nextRound();
                this.availableActions = ['fold', 'check', 'bet'];
                return { 'next-round': true };
            }
            break;

        case 'bet':
            // Add the bet to the pot.
            var bet = action[1];
            this.subtractChips(seat, 'Chips', bet);
            this.addChips(seat, 'Pot', bet);
            this.pot += bet;

            this.nextTurn();
            this.availableActions = ['fold', 'call', 'raise'];
            return { 'next-turn': true };
            break;

        case 'raise':
            // Raise the bet to action[1].
            var raiseTo = action[1];
            var raiseBy = raiseTo - this[nextPlayer() + 'Pot'];
            this.subtractChips(seat, 'Chips', raiseBy);
            this.addChips(seat, 'Pot', raiseBy);
            this.pot += raiseBy;

            this.nextTurn();
            this.availableActions = ['fold', 'call', 'raise'];
            return { 'next-turn': true };
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
    this.availableActions = ['fold', 'call', 'raise'];
    this.currentBet = 0;
    this.preflopActions = [];
    this.flopActions = [];
    this.turnActions = [];
    this.riverActions = [];
    this.winner = null;

    // Post blinds.
    if (isButton('seat1')) {
        this.seat1Pot = this.smallBlind;
        this.subtractChips('seat1', 'Chips', this.smallBlind);
        this.seat2Pot = this.bigBlind;
        this.subtractChips('seat2', 'Chips', this.bigBlind);
    } else {
        this.seat1Pot = this.bigBlind;
        this.subtractChips('seat1', 'Chips', this.bigBlind);
        this.seat2Pot = this.smallBlind;
        this.subtractChips('seat2', 'Chips', this.smallBlind);
    }
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
Gs.prototype.nextRound = function() {
    // Switch turn as well as switch round.
    switch (this.currentRound) {
        case preflop:
            this.currentRound = 'flop';
            break;
        case flop:
            this.currentRound = 'turn';
            break;
        case turn:
            this.currentRound = 'river';
            break;
    }
    this.seat1Pot = 0;
    this.seat2Pot = 0;
    this.actionOn = nextPlayer(this.actionOn);
};
Gs.prototype.subtract = function(seat, attr, chips) {
    this[seat + attr] -= chips;
};
Gs.prototype.add = function(seat, attr, chips) {
    this[seat + attr] += chips;
};
function otherPlayer(seat) {
    // Get other player from seat.
    return seat == 'seat1' ? 'seat2' : 'seat1';
}
function nextPlayer() {
    // Get next player.
    return this.actionOn == 'seat1' ? 'seat2' : 'seat1';
}
exports.Gs = Gs;
