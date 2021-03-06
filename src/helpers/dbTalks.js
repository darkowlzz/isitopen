var Q = require('q'),
    config = require('../config'),
    db = require('orchestrate')(config.db);


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
      deferred.resolve({
        data: "NOT FOUND",
        response: response
      });
    });
  return deferred.promise;
}
exports.getProperty = getProperty;


function putProperty(collection, key, data, update) {
  update = update || false;
  var deferred = Q.defer();
  db.put(collection, key, data, update)
    .then(function(response) { // jshint ignore:line
      deferred.resolve(true);
    })
    .fail(function(response) { // jshint ignore:line
      deferred.resolve(false);
    });
  /*
  Q.try(function() {
    return db.put(collection, key, data, update);
  })
  .then(function(response) {
    deferred.resolve(true);
  })
  .catch(function(err) {
    deferred.resolve(false);
  });
  */
  return deferred.promise;
}
exports.putProperty = putProperty;

function removeProperty(collection, key) {
  var deferred = Q.defer();
  Q.try(function() {
    return db.remove(collection, key, true);
  })
  .then(function(response) { // jshint ignore:line
    return db.get(collection, key);
  })
  .then(function(response) { // jshint ignore:line
    deferred.resolve('ITEM NOT DELETED');
  })
  .catch(function(err) { // jshint ignore:line
    deferred.resolve(true);
  });

  return deferred.promise;
}
exports.removeProperty = removeProperty;
