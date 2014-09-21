var Q = require('q'),
    config = require('./config'),
    db = require('orchestrate')(config.db);

// Parse a string number, split and return an array consisting of numbers.
exports.getNumberArray = function(strArray) {
  var numArray = strArray.split(',');
  for (var i = 0; i < numArray.length; i++)
    numArray[i] = parseFloat(numArray[i]);
  return numArray;
}

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
exports.getProperty = getProperty;

function putProperty(collection, key, data) {
  var deferred = Q.defer();
  db.put(collection, key, data)
    .then(function(response) {
      deferred.resolve(true);
    })
    .fail(function(err) {
      deferred.resolve(false);
    });
  return deferred.promise;
}
exports.putProperty = putProperty;

function removeProperty(collection, key) {
  var deferred = Q.defer();
  db.remove(collection, key, true)
    .then(function(response) {
      db.get(collection, key)
        .then(function(response) {
          deferred.resolve({
            message: 'item not deleted'
          });
        })
        .fail(function(response) {
          if (response.body.code == 'items_not_found') {
            deferred.resolve({
              message: 'item deleted'
            });
          }
          deferred.resolve(response);
        });
    })
    .fail(function(response) {
      deferred.resolve('could not send delete req');
    });
  return deferred.promise;
}
exports.removeProperty = removeProperty;
