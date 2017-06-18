var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var proxy = require('http-proxy-middleware');

var app = express();

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/info', proxy({
    target: 'https://api.flightstats.com', 
    changeOrigin: true,
     pathRewrite: {
            '^/info' : '/flex/flightstatus/rest/v2/jsonp/airport/status/',  
        },
}));

app.get('/', (req, res, next) => {
    res.send(path.resolve(__dirname, 'public', 'index.html'));
});


// 404
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// errors
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    // res.render('error');
});

module.exports = app;
