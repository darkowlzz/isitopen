/**
 * A module to help perform basic operations.
 * @module operations
 */

var Q = require('q'),
    uuid = require('node-uuid'),
    utils = require('./utils'),
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
    })
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
        return [key2, true];
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
 * @return {Array} - Consisting of an object of the response data of user
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
    .catch(function(err) {
      return [err, false];
    });
}
exports.verifyUserKey = verifyUserKey;


/**
 * Generate a new public API key.
 * @param {string} username - Username of the account.
 * @param {string} publicKey - A Public API key.
 * @return {Array} - Consisting of new API key and boolean result of the
 * operation.
 */
function generateNewAPI(username, publicKey) {
  return Q.try(function() {
      return verifyUserKey(username, publicKey);
    })
    .spread(function(extras, resp) {
      if (resp) {
        var newkey = uuid();
        extras.data.publicKey.push(newkey);
        return [newkey,
                dbTalks.putProperty('users', username,
                                    extras.data, extras.ref)];
      }
      else {
        return [extras, resp];
      }
    })
    .catch(function(err) {
      return [err, false];
    });
}
exports.generateNewAPI = generateNewAPI;
