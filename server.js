var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    Q = require('q'),
    config = require('./config.js'),
    db = require('orchestrate')(config.db),
    uuid = require('node-uuid'),
    helper = require('./helper');

var app = express();


app.use(morgan('combined'));
app.use(bodyParser.json());

app.get('/place/:id', function(req, res, next) {
  return helper.getProperty('places', req.params.id)
           .then(function(response) {
             res.send(response.data);
           });
});

app.post('/place/create', function(req, res, next) {
  var r = req.body;
  var coord;
  if (r.coordinates) {
    coord = helper.getNumberArray(r.coordinates);
  }
  var aPlace = {
    place: r.name,
    location: r.location || 'unknown',
    coordinates: coord || 'unknown',
    status: false,
    tags: r.tags || 'unknown',
    products: r.products || 'unknown',
    desc: r.description || 'unknown',
    createdBy: r.user || 'unknown',
    id: '',
    apiKey: r.apikey || 'unknown',
    lastUpdated: 'unknown'
  };

  return helper.getProperty('stats', 'counts')
           .then(function(response) {
             var count = response.data.value || 0;
             response.data.value = count + 1;
             aPlace.id = response.data.value;
            
             helper.putProperty('places', aPlace.id, aPlace)
               .then(function(resp) {
                 if (resp == true) {
                   helper.putProperty('stats', 'idCounter',
                                       response.data, response.ref)
                     .then(function(resp) {
                       if (resp == true)
                         res.send('place created');
                       else
                         res.send('failed to create');
                     })
                 } else {
                   res.send('failed to insert');
                 }
               })
               .fail(function(err) {
                 res.send('failed to create new place');
               })
           })
           .fail(function(err) {
             res.send('failed to get count');
           });

});

app.post('/place/remove', function(req, res, next) {
  var r = req.body;
  var target = {
    name: r.name,
    apikey: r.apikey
  };
  helper.getProperty('places', target.name)
    .then(function(response) {
      if (response.data.apiKey == target.apikey){
        helper.removeProperty('places', target.name)
          .then(function(response) {
            res.send(response);
          });
      } else {
        res.send('API KEYS FALSE');
      }
    });
});

app.post('/user/create', function(req, res, next) {
  var r = req.body;

  var aUser = {
    username: r.username
  };

  return helper.putProperty('users', aUser.username, aUser)
           .then(function(response) {
             res.send('')
           })
});

app.post('/stats/set', function(req, res, next) {
  var r = req.body;

  var counts = {
    idCounter: r.idCounter,
    placeCount: r.placeCount,
    userCount: r.userCount
  };

  helper.getProperty('stats', 'counts')
    .then(function(response) {
      if (counts.idCounter != '')
        response.data.idCounter = counts.idCounter;
      if (counts.placeCount != '')
        response.data.placeCount = counts.placeCount;
      if (counts.userCount != '')
        response.data.userCount = counts.userCount;

      helper.putProperty('stats', 'counts', response.data, response.ref)
        .then(function(response) {
          if (response == true)
            res.send('stats set successfully');
          else
            res.send('failed to set stats');
        })
        .fail('failed to set');
    })
    .fail('failed to get stats');
});


var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});

exports.app = app;
