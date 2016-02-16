var express = require('express');
var cons = require('consolidate');
var bodyParser = require('body-parser');
var app = express();




// SETTING APP TEMPLATING STUFF
app.engine('html', cons.handlebars);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies


//Allowing the app to use the public folder content
app.use("/", express.static(__dirname + '/public'));



// ROUTING DEFINITION FOR THE FIRST PAGE
app.get('/', function (req, res) {
  res.redirect('/hotel');
});

// FORWARDING TRAFFIC FROM /hotel ROUTE TO ITS CONTROLLER
app.use('/hotel', require('./controllers/hotels'));


// PORT DEFINITION FOR THE PROCESS
var port = process.env.PORT || 5000

// SERVER RUN
var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);

});
