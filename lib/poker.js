var http = require('http');
var app = require('./webserver').app;
var server = require('./webserver').server;
var io = require('socket.io');
var matchmaker = require('./matchmaker').matchmaker;
var game = require('./game').game;


var Poker = function() {
    this.app = app;
    this.server = server;
}

Poker.prototype.start = function() {
    this.io = io.listen(4001);
    this.io.set('log level', 2);

    // Multiplex socket IO requests to different handlers..
    this.io.of('/matchmaking').on('connection', matchmaker);
    this.io.of('/game').on('connection', game);

    if (this.server.address())
      console.log('Poker started on port %s.', this.server.address().port);
}

module.exports = Poker;
