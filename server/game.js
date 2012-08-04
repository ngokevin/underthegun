// Start up match-making server.
var http = require('http').createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Hello World');
}).listen(8433);

// Connect to DB.
var mysql = require("db-mysql");
new mysql.Database({
    "hostname": "localhost",
    "user": "root",
    "password": "yoursql",
    "database": "underthegun"
}).connect(function(error) {
    if (error) {
        return console.log('Database connection error: ' + error);
    }
});

// Global vars.
var newGameMatchQueue = {};

var io = require('socket.io').listen(http);
io.sockets.on('connection', function(socket) {
    var seat1, seat2;
});

function f() { return false; }
console.log('Server running at localhost:8433');
