var https = require('https');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var exphbs = require('express3-handlebars');
var flash = require('connect-flash');
var morgan = require('morgan');
var credentials = require('./credentials.js');
var app = express();
var passport = require('passport');
var env = app.get('env');

// ----------------- mongodb --------------------------------
var mongoose = require('mongoose');

var opts = {
            server: {
                    socketOptions: { keepAlive: 1 }
            }
};

var sslOptions = {
    key: fs.readFileSync(__dirname + '/certificates/https_certificates/camel_ssl_key.key'),
    cert: fs.readFileSync(__dirname + '/certificates/https_certificates/camel_ssl_cert.crt'),
    ca: [
        fs.readFileSync(__dirname + '/certificates/https_certificates/ca.pem'),
        fs.readFileSync(__dirname + '/certificates/https_certificates/sub.class1.server.ca.pem')
    ],
    passphrase: credentials.ssl_passphrase
};

switch(app.get('env')) {
    case 'development':
        mongoose.connect(credentials.mongo.development.connectionString, opts);
        break;
    case 'production':
        mongoose.connect(credentials.mongo.production.connectionString, opts);
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}
// ------------------ end mongodb ---------------------------

require('./passport.js')(passport, env);

// ------------------- set up express application ----------------
app.set('port', (process.env.PORT || 8008));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// ------- required for passport -----------
app.use(session({secret: credentials.cookieSecret.secret}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());            // use connect-flash for flash messages stored in session

app.disable('x-powered-by');

// -------------- routes -----------------------
require('./routes.js')(app, passport);

// custom 404 page
app.use(function(req, res){ res.type('text/plain');
    res.status(404);
    res.send('404 - error');
});
// custom 500 page
app.use(function(err, req, res, next){ console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Server Error');
});

// -------------- launch --------------------------------
// https config
/*
https.createServer(sslOptions, app).listen(app.get('port'), function(){
    console.log('Express started in ' + app.get('env') +
    ' mode on port ' + app.get('port') + '.');
});
*/
// http config

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
