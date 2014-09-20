var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    request = require('request'),
    Q = require('q'),
    config = require('./config.js'),
    db = require('orchestrate')(config.db),
    uuid = require('node-uuid');

var app = express();


app.use(morgan('combined'));
app.use(bodyParser.json());

app.get('/place/:id', function(req, res, next) {
  return getProperty('places', req.params.id)
               .then(function(response) {
                 console.log(response.data);
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
    apiKey: 'unknown',
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
    })
  return deferred.promise;
}
exports.putProperty = function(collection, key, data) {
  return putProperty(collection, key, data);
};

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
