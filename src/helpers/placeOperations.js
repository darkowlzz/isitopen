/**
 * A module to help perform basic place related operations.
 * @module placeOperations
 */

var Q = require('q'),
    dbTalks = require('./dbTalks');


/**
 * Gets a new place id.
 * @return {Object} - Consisting of a new place id and the result of the
 * operation.
 */
function getNewPlaceId() {
  return Q.try(function() {
      return dbTalks.getProperty('stats', 'counts');
    })
    .then(function(resp) {
      if (resp != 'NOT FOUND') {
        return {
          id: (resp.data.idCounter + 1),
          resp: resp
        };
      }
      else {
        return {
          error: 'Could not get a place id'
        };
      }
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.getNewPlaceId = getNewPlaceId;


/**
 * Registers a given place.
 * @param {Object} - A place object with `id`.
 * {
 *   creator: <String>
 *   token: <String>,
 *   name: <String>,
 *   location: <String>,
 *   coordinates: <String>,
 *   tags: <String>,
 *   desc: <String>,
 *   id: <Number>
 * }
 * @return {Object} - Consisting of id of the created place and result of the
 * operation.
 */
function registerPlace(place) {
  return Q.try(function() {
      return dbTalks.putProperty('places', place.id, place);
    })
    .then(function(resp) {
      if (resp === true) {
        return {
          success: true,
          placeId: place.id
        };
      }
      else {
        return {
          success: false,
          error: 'Failed to register place'
        };
      }
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.registerPlace = registerPlace;


/**
 * Deregisters a given place.
 * @param {String} - A place id.
 * @return {Object} - Consisting of boolean result of the operation.
 */
function deregisterPlace(placeId) {
  return Q.try(function() {
      return dbTalks.removeProperty('places', placeId);
    })
    .then(function(resp) {
      if (resp === true) {
        return {
          success: true
        };
      }
      else {
        return {
          success: false,
          error: 'Failed to deregister place'
        };
      }
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.deregisterPlace = deregisterPlace;


/**
 * Add a given place to user's `places` field.
 * @param {Object} - A place object with required properties `creator`, `id` &
 * `name`.
 * @return {Object} - Consisting of boolean result of the operation.
 */
function addPlaceToUser(place) {
  return Q.try(function() {
      return dbTalks.getProperty('users', place.creator);
    })
    .then(function(resp) {
      var mPlace = {
        id: place.id,
        name: place.name
      };
      resp.data.places.push(mPlace);
      return dbTalks.putProperty('users', place.creator, resp.data, resp.ref);
    })
    .then(function(resp) {
      return {
        success: resp
      };
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.addPlaceToUser = addPlaceToUser;


/**
 * Remove a given place from user's `places` field.
 * @param {Object} - A place object with required properties `creator` & `id`.
 * @return {Object} - Consisting of boolean result of the operation.
 */
function removePlaceFromUser(place) {
  return Q.try(function() {
      return dbTalks.getProperty('users', place.creator);
    })
    .then(function(resp) {
      for (var i = 0; i < resp.data.places.length; i++) {
        if (resp.data.places[i].id == place.id) {
          break;
        }
      }
      resp.data.places.splice(i, 1);
      return dbTalks.putProperty('users', place.creator, resp.data, resp.ref);
    })
    .then(function(resp) {
      return {
        success: resp
      };
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.removePlaceFromUser = removePlaceFromUser;


/**
 * Create a new place.
 * @param {Object} - A place object.
 * {
 *   creator: <String>
 *   token: <String>,
 *   name: <String>,
 *   location: <String>,
 *   coordinates: <String>,
 *   tags: <String>,
 *   desc: <String>
 * }
 * @return {Object} - Consisting of id of the place created and result of the
 * performed operation.
 */
function createPlace(place) {
  return Q.try(function() {
      return getNewPlaceId();
    })
    .then(function(resp) {
      if (resp.hasOwnProperty('id')) {
        place.id = resp.id;
        return registerPlace(place);
      }
      else {
        return {
          error: resp.error
        };
      }
    })
    .then(function(resp) {
      if (resp.success === true) {
        return incrementPlaceCount();
      }
      else {
        return { success: false };
      }
    })
    .then(function(resp) {
      if (resp.success === true) {
        return addPlaceToUser(place);
      }
      else {
        return { success: false };
      }
    })
    .then(function(resp) {
      if (resp.error) {
        return {
          error: resp.error
        };
      }
      else {
        return {
          success: resp.success,
          placeId: place.id
        };
      }
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.createPlace = createPlace;


/**
 * Delete a place.
 * @param {Object} - Consisting of place id.
 * @return {Object} - Consisting of a boolean result of the operation.
 */
function deletePlace(place) {
  return Q.try(function() {
      return deregisterPlace(place.id);
    })
    .then(function(resp) {
      if (resp.success === true) {
        return decrementPlaceCount();
      }
      else {
        return {
          success: false
        };
      }
    })
    .then(function(resp) {
      if (resp.success === true) {
        return removePlaceFromUser(place);
      }
      else {
        return {
          success: false
        };
      }
    })
    .then(function(resp) {
      if (resp.error) {
        return {
          error: resp.error
        };
      }
      else {
        return {
          success: resp.success
        };
      }
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.deletePlace = deletePlace;


/**
 * Increment placeCount and idCounter of stats.
 * @return {Object} - Consisting of result of operation, idCounter &
 * placeCount after incrementing.
 */
function incrementPlaceCount() {
  return Q.try(function() {
      return dbTalks.getProperty('stats', 'counts');
    })
    .then(function(resp) {
      if (resp != 'NOT FOUND') {
        resp.data.idCounter++;
        resp.data.placeCount++;
        return [resp.data.idCounter, resp.data.placeCount,
                dbTalks.putProperty('stats', 'counts', resp.data, resp.ref)];
      }
      else {
        return false;
      }
    })
    .spread(function(idCounter, placeCount, resp) {
      return {
        success: resp,
        idCounter: idCounter,
        placeCount: placeCount
      };
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.incrementPlaceCount = incrementPlaceCount;


/**
 * Decrement placeCount.
 * @return {Object} - Consisting of result of operation & placeCount after
 * decrementing.
 */
function decrementPlaceCount() {
  return Q.try(function() {
      return dbTalks.getProperty('stats', 'counts');
    })
    .then(function(resp) {
      if (resp != 'NOT FOUND') {
        resp.data.placeCount--;
        return [resp.data.placeCount,
                dbTalks.putProperty('stats', 'counts', resp.data, resp.ref)];
      }
      else {
        return false;
      }
    })
    .spread(function(placeCount, resp) {
      return {
        success: resp,
        placeCount: placeCount
      };
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.decrementPlaceCount = decrementPlaceCount;
