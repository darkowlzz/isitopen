/**
 * A module to help perform basic user related operations.
 * @module userOperations
 */

var Q = require('q'),
    uuid = require('node-uuid'),
    dbTalks = require('./dbTalks');


/**
 * Checks the availability of a username.
 * @param {string} username - Username to be checked for availability.
 * @returns {Array} - Consisting of an object of response data and a boolean
 * indicating username availability.
 *
 * NOTE: This has to be called before `createNewUser` when registering a new
 * user.
 */
function usernameAvailability(username) {
  return Q.try(function() {
      return dbTalks.getProperty('users', username);
    })
    .then(function(resp) {
      if (resp.data !== 'NOT FOUND') {
        return [resp, false];
      }
      else {
        return [resp, true];
      }
    })
    .catch(function(err) {
      return [err, false];
    });
}
exports.usernameAvailability = usernameAvailability;


/**
 * Create a new user.
 * @param {string} username - Username to be registered.
 * @returns {string} - A public API key.
 *
 * NOTE: This must be called only after `usernameAvailability`.
 */
function createNewUser(username) {
  var key1 = uuid();
  var key2 = uuid();

  var aUser = {
    username: username,
    privateKey: key1,
    publicKey: [key2],
    places: []
  };

  return Q.try(function() {
      return dbTalks.putProperty('users', username, aUser);
    })
    .then(function(resp) {
      if (resp === true) {
        return {
          success: true,
          key: key2
        };
      }
      else {
        return ['Failed to create user', false];
      }
    })
    .catch(function(err) {
      return [err, false];
    });
}
exports.createNewUser = createNewUser;


/**
 * Verify username and publicKey pair.
 * @param {string} username - Username to be verified.
 * @param {string} publicKey - Public API key to be verified.
 * @return {Object} - Consisting of an object of the response data of user
 * query and boolean result of verification.
 */
function verifyUserKey(username, publicKey) {
  return Q.try(function() {
      return dbTalks.getProperty('users', username);
    })
    .then(function(resp) {
      if (resp.data.publicKey.indexOf(publicKey) > -1) {
        return [resp, true];
      }
      else {
        return [resp, false];
      }
    })
    .spread(function(extras, resp) {
      return {
        success: resp,
        extras: extras
      };
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.verifyUserKey = verifyUserKey;


/**
 * Generate a new public API key.
 * @param {string} username - Username of the account.
 * @param {string} publicKey - A Public API key.
 * @return {Object} - Consisting of new API key and boolean result of the
 * operation.
 */
function generateNewAPI(username, publicKey) {
  return Q.try(function() {
      return verifyUserKey(username, publicKey);
    })
    .then(function(resp) {
      if (resp.success) {
        var newkey = uuid();
        resp.extras.data.publicKey.push(newkey);
        return [newkey,
                dbTalks.putProperty('users', username,
                                    resp.extras.data, resp.extras.ref)];
      }
      else {
        if (resp.hasOwnProperty('success')) {
          return [{}, resp.success];
        }
        else {
          return [{}, resp];
        }
      }
    })
    .spread(function(key, resp) {
      if (resp.error) {
        return {
          error: resp.error
        };
      }
      else {
        return {
          success: resp,
          key: key
        };
      }
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.generateNewAPI = generateNewAPI;


/**
 * Revoke public API key, given the username and the key.
 * @param {string} username - Username of the account.
 * @param {string} key - API key to revoke.
 * @return {Object} - Consisting of the revoked key and boolean result of the
 * operation.
 */
function revokeKey(username, key) {
  return Q.try(function() {
      return verifyUserKey(username, key);
    })
    .then(function(resp) {
      if (resp.success) {
        var index = resp.extras.data.publicKey.indexOf(key);
        resp.extras.data.publicKey.splice(index, 1);
        return [key, dbTalks.putProperty('users', username,
                                         resp.extras.data, resp.extras.ref)];
      }
      else {
        if (resp.hasOwnProperty('success')) {
          return [{}, resp.success];
        }
        else {
          return [{}, resp];
        }
      }
    })
    .spread(function(key, resp) {
      if (resp.error) {
        return {
          error: resp.error
        };
      }
      else {
        return {
          success: resp,
          key: key
        };
      }
    })
    .catch(function(err) {
      return {
        error: err
      };
    });
}
exports.revokeKey = revokeKey;


/**
 * Rename user account.
 * @param {string} username - Username of the account.
 * @param {string} newusername - New username of the account.
 * @param {string} key - A public API key.
 * @return {boolean} - Result of the operation.
 */
function renameUser(username, newusername, key) {
  return Q.try(function() {
      return verifyUserKey(username, key);
    })
    .then(function(resp) {
      if (resp.success) {
        resp.extras.data.username = newusername;
        return dbTalks.putProperty('users', newusername, resp.extras.data);
      }
      else {
        return resp.success;
      }
    })
    .then(function(resp) {
      if (resp) {
        return dbTalks.removeProperty('users', username);
      }
      else {
        return resp;
      }
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
exports.renameUser = renameUser;


/**
 * Delete user account.
 * @param {string} username - Username of the account.
 * @param {string} key - A public API key.
 * @return {boolean} - Result of the operation.
 */
function deleteUser(username, key) {
  return Q.try(function() {
      return verifyUserKey(username, key);
    })
    .then(function(resp) {
      if (resp.success) {
        return dbTalks.removeProperty('users', username);
      }
      else {
        return resp.success;
      }
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
exports.deleteUser = deleteUser;


/**
 * Initialize stats.
 * @return {Object} - Consisting of the boolean result of the operation.
 */
function initializeStats() {
  return Q.try(function() {
      return dbTalks.getProperty('stats', 'counts');
    })
    .then(function(resp) {
      if (resp != 'NOT FOUND') {
        var reset = false;
        if (resp.data.idCounter !== 0) {
          reset = true;
        }
        if (resp.data.placeCount !== 0) {
          reset = true;
        }
        if (resp.data.userCount !== 0) {
          reset = true;
        }

        if (reset) {
          resp.data.idCounter = 0;
          resp.data.placeCount = 0;
          resp.data.userCount = 0;
          return dbTalks.putProperty('stats', 'counts', resp.data, resp.ref);
        }
        else {
          return true;
        }
      }
      else {
        return false;
      }
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
exports.initializeStats = initializeStats;


/**
 * Set stats value.
 * @param {Object} - An Object with stats properties.
 * {
 *   idCounter: X,
 *   placeCount: Y,
 *   userCount: Z
 * }
 * @return {Object} - Consisting of the boolean result of the operation.
 */
function setStats(statsVal) {
  return Q.try(function() {
      return dbTalks.getProperty('stats', 'counts');
    })
    .then(function(resp) {
      if (resp != 'NOT FOUND') {
        resp.data.idCounter = statsVal.idCounter;
        resp.data.placeCount = statsVal.placeCount;
        resp.data.userCount = statsVal.userCount;
        return dbTalks.putProperty('stats', 'counts', resp.data, resp.ref);
      }
      else {
        return false;
      }
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
exports.setStats = setStats;
