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
    this.button = null;
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.seat1Chips = 1500;
    this.seat2Chips = 1500;
    this.seat1Hole = [];
    this.seat2Hole = [];
    this.pot = 30;
    this.seat1Pot = 0;
    this.seat2Pot = 0;
    this.currentRound = null;
    this.boardCards = [];
    this.actionOn = null;
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
    // move onto the next round. We store each player's VPIP for the current
    // round to calculate how much to call a bet or raise.
    this[this.currentRound + 'Actions'].push(action);
    if (this.availableActions.indexOf(action.action) < 0) {
        return {'error': true}
    }

    switch (action.action) {
        case 'fold':
            // Next hand if a player folds.
            this.winner = this.getNextPlayer();
            this[this.winner + 'Chips'] += this.pot;
            return {'hand-complete': true};
            break;

        case 'check':
            if (this.isButton(seat)) {
                if (this.currentRound == 'river') {
                    // End hand if button checks back river.
                    this.calcWinner();
                    return {'hand-complete': true};
                } else {
                    // Next round if button checks back round.
                    this.nextRound();
                    this.availableActions = ['fold', 'check', 'bet'];
                    return {'next-round': true};
                }
            } else {
                if (this.currentRound == 'preflop') {
                    // Next round if big blind checks.
                    this.nextRound();
                    this.availableActions = ['fold', 'check', 'bet'];
                    return {'next-round': true};
                } else {
                    // Next turn if big blind leads with check.
                    this.nextTurn();
                    this.availableActions = ['fold', 'check', 'bet'];
                    return {'next-turn': true};
                }
            }

        case 'call':
            // Add the call to the pot.
            var toCall = this[this.getNextPlayer() + 'Pot'] - this[seat + 'Pot'];
            this[seat + 'Chips'] -= toCall;
            this[seat + 'Pot'] += toCall;
            this.pot += toCall;

            if (this.currentRound == 'preflop' && this.isButton(seat) && this[seat + 'Pot'] == this.bigBlind) {
                // If button limps preflop.
                this.nextTurn();
                this.availableActions = ['fold', 'check', 'raise'];
                return {'next-turn': true};
            } else if (this.currentRound == 'river') {
                // End hand if player calls river bet.
                this.calcWinner();
                return {'hand-complete': true};
            } else {
                // Next round if player calls bet.
                this.nextRound();
                this.availableActions = ['fold', 'check', 'bet'];
                return {'next-round': true};
            }
            break;

        case 'bet':
            // Add the bet to the pot.
            var bet = action.amount;
            this[seat + 'Chips'] -= bet;
            this[seat + 'Pot'] += bet;
            this.pot += bet;

            this.nextTurn();
            this.availableActions = ['fold', 'call', 'raise'];
            return {'next-turn': true};
            break;

        case 'raise':
            // Raise the bet to the raise amount.
            var raiseTo = action.amount;
            var raiseBy = raiseTo - this[this.getNextPlayer() + 'Pot'];
            this[seat + 'Chips'] -= raiseBy;
            this[seat + 'Pot'] += raiseBy;
            this.pot += raiseBy;

            this.nextTurn();
            this.availableActions = ['fold', 'call', 'raise'];
            return {'next-turn': true};
            break;
    }
};

Gs.prototype.calcWinner = function() {
    var seat1Hand = this.getHand(this.seat1Hole);
    var seat2Hand = this.getHand(this.seat2Hole);
    return;
};

Gs.prototype.getHand = function(hole) {
    // Sort hand by rank.
    var hand = this.boardCards.concat(hole);
    hand.sort(function(a, b) { return a.rank - b.rank; });

    function calcHand(hand) {
        // Iterates through hand, recursively removing a card until we get
        // five-card hands. Determines the strength of hand, returns it, and
        // the best hand will bubble up the stack.
        var i;
        if (hand.length == 5) {
            // Get histogram of hand.
            var cardinalities = {};
            for (i = 0; i < hand.length; i++) {
                if (hand[i].rank in cardinalities) {
                    cardinalities[hand[i].rank]++;
                } else {
                    cardinalities[hand[i].rank] = 1;
                }
            }
            var histogram = {};
            for (rank in cardinalities) {
                var cardinality = cardinalities[rank];
                var bucketedCardinality = {};
                bucketedCardinality[rank] = cardinality;
                if (cardinality in histogram) {
                    histogram[cardinality].push(bucketedCardinality);
                } else {
                    histogram[cardinality] = [bucketedCardinality];
                }
            }

            // Calculate hand strength.
            if ('4' in histogram) {
                // Quads.
                console.log('quads');
            } else if ('3' in histogram && '2' in histogram) {
                // Boat.
                console.log('boat');
            } else if ('3' in histogram) {
                // Trips.
                console.log('trips');
            } else if ('2' in histogram && histogram['2'].length == 2) {
                // Two-pair.
                console.log('two-pair');
            } else if ('2' in histogram) {
                // Pair.
                console.log('pair');
            } else {
                var hasFlush = true;
                for (i=0; i < hand.length - 1; i++) {
                    if (hand[i].suit != hand[i + 1].suit) {
                        hasFlush = false;
                        break;
                    }
                }
                var hasStraight = (hand[4].rank - hand[1].rank == 4 ||
                                   hand[4].rank == 13 && hand[3].rank == 5);

                if (hasFlush && hasStraight) {
                    console.log('straight flush');
                } else if (hasFlush) {
                    console.log('flush');
                } else if (hasStraight) {
                    console.log('straight');
                } else {
                    // High card.
                    console.log('high card');
                }
            }
            return;
        }

        var bestHand;
        for (i = 0; i < hand.length; i++) {
            var slicedHand = hand.slice(0); slicedHand.remove(i);
            calcHand(slicedHand);
            continue;
            if (!bestHand || compareHand(possibleBestHand, bestHand)) {
                bestHand = possibleBestHand;
            }
        }
        return bestHand;
    }

    calcHand(hand);
};

Gs.prototype.newHand = function() {
    this.deck.shuffle();
    if (this.button) {
        this.button = this.getNextPlayer(this.button);
    } else {
        this.button = 'seat1';
    }
    this.pot = this.smallBlind + this.bigBlind;
    this.currentRound = 'preflop';
    this.seat1Hole = [];
    this.seat2Hole = [];
    this.boardCards = [];
    this.actionOn = this.button;
    this.availableActions = ['fold', 'call', 'raise'];
    this.currentBet = 0;
    this.preflopActions = [];
    this.flopActions = [];
    this.turnActions = [];
    this.riverActions = [];
    this.winner = null;

    // Post blinds.
    if (this.isButton('seat1')) {
        this.seat1Pot = this.smallBlind;
        this['seat1Chips'] -= this.smallBlind;
        this.seat2Pot = this.bigBlind;
        this['seat2Chips'] -= this.bigBlind;
    } else {
        this.seat1Pot = this.bigBlind;
        this['seat1Chips'] -= this.bigBlind;
        this.seat2Pot = this.smallBlind;
        this['seat2Chips'] -= this.smallBlind;
    }
};

Gs.prototype.filter = function(seat) {
    // Hide certain values based on seat (for security reasons so they can't
    // snoop other player's hole cards or next card in deck).
    var filterKeys = [getOtherPlayer(seat) + 'Hole', 'deck'];
    var filteredGs = {}
    for(var keys = Object.keys(this), l = keys.length; l; --l) {
        if (filterKeys.indexOf(keys[l-1]) < 0) {
            filteredGs[ keys[l-1] ] = this[ keys[l-1] ];
        }
    }
    return filteredGs;
};

Gs.prototype.nextTurn = function() {
    // Switch turn to next player (action on other player).
    this.actionOn = this.getNextPlayer(this.actionOn);
};

Gs.prototype.nextRound = function() {
    // Switch turn as well as switch round.
    switch (this.currentRound) {
        case 'preflop':
            this.currentRound = 'flop';
            var flop = this.deck.draw(3);
            this.boardCards = this.boardCards.concat(flop);
            break;
        case 'flop':
            this.currentRound = 'turn';
            this.boardCards.push(this.deck.draw());
            break;
        case 'turn':
            this.currentRound = 'river';
            this.boardCards.push(this.deck.draw());
            break;
    }
    this.seat1Pot = 0;
    this.seat2Pot = 0;
    this.actionOn = this.getNextPlayer(this.actionOn);
};

Gs.prototype.hasGameWinner = function() {
    // Check if anyone has busted.
    if (this.seat1Chips === 0) { return 'seat2'; }
    else if (this.seat2Chips === 0) { return 'seat1'; }
    return false;
}

Gs.prototype.isButton = function(seat) {
    return seat == this.button ? true : false;
}

Gs.prototype.getNextPlayer = function() {
    // Get next player.
    return this.actionOn == 'seat1' ? 'seat2' : 'seat1';
}

function getOtherPlayer(seat) {
    // Get other player from seat.
    return seat == 'seat1' ? 'seat2' : 'seat1';
}

exports.Gs = Gs;


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
   var rest = this.slice((to || from) + 1 || this.length);
   this.length = from < 0 ? this.length + from : from;
   return this.push.apply(this, rest);
};
