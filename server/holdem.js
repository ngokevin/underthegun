// Deck Stuff
var Deck = function() {
    this.deck = createDeck();
}
Deck.prototype.draw = function(n) {
    if (!n || n == 1) {
        return this.deck.pop();
    }
    return this.deck.splice(0, n);
}
exports.Deck = Deck;

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

// Game State Stuff

// Shared game state of a hand.
var Gs = function() {
    this.seat1Id = null;
    this.seat2Id = null;
    this.button = 'seat1';
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.seat1Chips = 1500;
    this.seat2Chips = 1500;
    this.pot = 30;
    this.currentRound = 'preflop';
    this.flop1 = null;
    this.flop2 = null;
    this.flop3 = null;
    this.turn = null;
    this.river = null;
    this.actionOn = 'seat1';
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
            // Next round if a player folds.
            this[winner] = getOtherPlayer(seat);
            return { 'handComplete': true };
            break;
        case 'check':
            if (seat == this.button) {
                // Or end hand if player checks back the river.
                if (this.currentRound == 'river') {
                    // TODO: calculate winner
                    return { 'hand-complete': true };
                // Next round if last player checks.
                } else {
                    return true;
                }
            }
        case 'call':
            break;
        case 'bet':
            break;
        case 'raise':
            break;
    }
}
exports.Gs = Gs;
