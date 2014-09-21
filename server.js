var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    request = require('request'),
    Q = require('q'),
    config = require('./config.js'),
    db = require('orchestrate')(config.db),
    uuid = require('node-uuid');

var app = express();


//app.use(morgan('combined'));
app.use(bodyParser.json());

app.get('/place/:id', function(req, res, next) {
  return getProperty('places', req.params.id)
           .then(function(response) {
             res.send(response.data);
           });
});

app.post('/place/create', function(req, res, next) {
  var r = req.body;
  var aPlace = {
    place: r.name,
    location: r.location || 'unknown',
    coordinates: r.coordinates || 'unknown',
    status: false,
    tags: r.tags || 'unknown',
    products: r.products || 'unknown',
    desc: r.description || 'unknown',
    createdBy: r.user || 'unknown',
    id: 'unknown',
    apiKey: r.apikey || 'unknown',
    lastUpdated: 'unknown'
  };
  return putProperty('places', aPlace.place, aPlace)
           .then(function(response) {
             res.send(response);
           });
});

function getProperty(collection, key) {
  var deferred = Q.defer();
  db.get(collection, key)
    .then(function(response) {
      var ref = response.headers.etag;

      deferred.resolve({
        ref: ref,
        data: response.body
      });
    })
    .fail(function(response) {
      console.log('failed! maybe because the element is not found');
      deferred.resolve({
        data: "Error! Maybe because the query failed"
      });
    });
  return deferred.promise;
};
exports.getProperty = function(collection, key) {
  return getProperty(collection, key);
};

function putProperty(collection, key, data) {
  var deferred = Q.defer();
  db.put(collection, key, data)
    .then(function(response) {
      deferred.resolve('place created successfully');
    })
    .fail(function(err) {
      deferred.resolve('error while creating place');
    });
  return deferred.promise;
}
exports.putProperty = function(collection, key, data) {
  return putProperty(collection, key, data);
};

app.post('/place/remove', function(req, res, next) {
  var r = req.body;
  var target = {
    name: r.name,
    apikey: r.apikey
  };
  getProperty('places', target.name)
    .then(function(response) {
      console.log('response data: ' + JSON.stringify(response.data));
      if (response.data.apiKey == target.apikey){
        console.log('API KEYS MATCH');
        removeProperty('places', target.name)
          .then(function(response) {
            res.send(response);
          });
      } else {
        console.log('API keys dont match');
        res.send('API KEYS FALSE');
      }
    });
});

function removeProperty(collection, key) {
  var deferred = Q.defer();
  db.remove(collection, key, true)
    .then(function(response) {
      console.log('TARGET KILLED');
      db.get(collection, key)
        .then(function(response) {
          console.log(response);
          deferred.resolve({
            message: 'item not deleted'
          });
        })
        .fail(function(response) {
          console.log(response.body);
          if (response.body.code == 'items_not_found') {
            deferred.resolve({
              message: 'item deleted'
            });
          }
          deferred.resolve(response);
        });
      //deferred.resolve()
    })
    .fail(function(response) {
      deferred.resolve('could not send delete req');
    });
  return deferred.promise;
}

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});

exports.app = app;
