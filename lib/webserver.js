var http = require('http');
var express = require('express');
var path = require('path');
var config = require('../config');


var app = exports.app = express();
var server = exports.server = http.createServer(app);


app.configure(function() {
  var basePath = path.join(__dirname, '..');
  app.use('/', express.static(basePath + '/client'));
  app.use('/css', express.static(basePath + '/client/css'));
  app.use('/font', express.static(basePath + '/client/font'));
  app.use('/img', express.static(basePath + '/client/img'));
  app.use('/js', express.static(basePath + '/client/js'));
});


function configureApp(app, envConfig) {
  app.set('port', process.env.PORT || envConfig.port);
  app.set('client_port', process.env.PORT || envConfig.client_port);
}
app.configure('development', function() {
  envConfig = config.dev;
  configureApp(app, envConfig);
});
app.configure('production', function() {
  envConfig = config.prod;
  configureApp(app, envConfig);
});


// Get port for current environment
var port = app.set('port');
server.listen(port);


app.get('/', function(req, res){
  res.render('index.html');
});
