var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    Q = require('q'),
    uuid = require('node-uuid'),
    dbTalks = require('./helpers/dbTalks'),
    utils = require('./helpers/utils'),
    operations = require('./helpers/userOperations');

var app = express();


//app.use(morgan('combined'));
app.use(bodyParser.json());

app.get('/place/:name', function(req, res, next) {
  return Q.try(function() {
      return dbTalks.getProperty('placeid', req.params.name)
    })
    .then(function(response) {
      if (response.data != 'NOT FOUND')
        return dbTalks.getProperty('places', response.data.id);
      else
        throw new Error('Place not found');
    })
    .then(function(response) {
      var p = response.data;
      var data = {
        place: p.place,
        location: p.location,
        coordinates: p.coordinates,
        status: p.status,
        tags: p.tags,
        products: p.products,
        desc: p.desc,
        createdBy: p.createdBy,
        id: p.id,
        lastUpdated: p.lastUpdated
      };
      return res.send(data);
    })
    .catch(function(err) {
      res.send('Error: ' + err);
    });
});

// Create a new place
app.post('/place/create', function(req, res, next) {
  var r = req.body;
  var coord;
  if (r.coordinates) {
    coord = utils.getNumberArray(r.coordinates);
  }
  var aPlace = {
    place: r.name,
    location: r.location || 'unknown',
    coordinates: coord || 'unknown',
    status: false,
    tags: r.tags || 'unknown',
    products: r.products || 'unknown',
    desc: r.description || 'unknown',
    createdBy: r.username || 'unknown',
    id: '',
    apikeys: [r.apikey] || 'unknown',
    lastUpdated: 'unknown'
  };

  return Q.try(function() {
      console.log('getting users');
      //return [aPlace, dbTalks.getProperty('stats', 'counts')]
      return [aPlace, dbTalks.getProperty('users', aPlace.createdBy)];
    })
    .spread(function(target, resp) {
      if (resp.data.apikeys.indexOf(target.apikey[0]) > -1) {
        console.log('key recognized');
        return [target, true];
      }
      else
        throw new Error('API key not recognized.');
    })
    .spread(getStats)
    .spread(addNewPlaceToUser)
    .spread(addNewPlace)
    .spread(createUniquePlace)
    .spread(updateStats)
    .then(function(resp) {
      if (resp == true)
        return res.send('Place created');
      else
        return res.send('Failed to create');
    })
    .catch(function(error) {
      return res.send(error);
    })
});

function addNewPlaceToUser(aPlace, response) {
  console.log('Adding new place to user')
  var idCount = response.data.idCounter || 0;
  var placeCount = response.data.placeCount || 0;
  response.data.idCounter = idCount + 1;
  response.data.placeCount = placeCount + 1;
  aPlace.id = response.data.idCounter;
  return Q.try(function() {
      return dbTalks.getProperty('users', aPlace.createdBy);
    })
    .then(function(resp) {
      resp.data.places.push(aPlace.place);
      return dbTalks.putProperty('users', aPlace.createdBy,
                                 resp.data, resp.ref);
    })
    .then(function(resp) {
      return [aPlace, response];
    })
    .catch(function(err) {
      throw new Error('Failed to update places in user');
    });
}

function addNewPlace(aPlace, statsResp) {
  console.log('adding new place to places');
  return [aPlace, statsResp, dbTalks.putProperty('places', aPlace.id, aPlace)]
}

function createUniquePlace(aPlace, countStatus, resp) {
  console.log('creating unique place');
  if (resp == true) {
    var uniquePlace = {
      place: aPlace.place,
      id: aPlace.id
    };
    return [countStatus,
            dbTalks.putProperty('placeid', aPlace.place, uniquePlace)];
  }
  else {
    return res.send('failed to create new place');
  }
}

function updateStats(countStatus, resp) {
  console.log('updating stats');
  return dbTalks.putProperty('stats', 'counts',
                             countStatus.data, countStatus.ref);
}


// Delete a place
app.post('/place/remove', function(req, res, next) {
  var r = req.body;
  var target = {
    name: r.name,
    apikey: r.apikey
  };

  return Q.try(function() {
      return [target, dbTalks.getProperty('placeid', target.name)]
    })
    .spread(getPlaces) 
    .spread(verifyAPIkey)
    .spread(removePlaceid)
    .spread(removePlaceFromUser)
    .spread(getStats)
    .spread(updateStatsRemove)
    .then(function(resp) {
      return res.send('place removed successfully');
    })
    .catch(function(error) {
      return res.send(error);
    })
});

function getPlaces(target, response) {
  return [target, dbTalks.getProperty('places', response.data.id)];
}

function verifyAPIkey(target, resp) {
  if (resp.data.apikeys.indexOf(target.apikey) > -1) {
    return [target, resp.data.createdBy,
            dbTalks.removeProperty('places', resp.data.id)];
  }
  else {
    throw new Error('API key not recognized.');
  }
}

function removePlaceid(target, createdBy, resp) {
  return [target, createdBy, dbTalks.removeProperty('placeid', target.name)];
}

function removePlaceFromUser(target, createdBy, response) {
  return Q.try(function() {
      return dbTalks.getProperty('users', createdBy);
    })
    .then(function(resp) {
      var index = resp.data.places.indexOf(target.name);
      resp.data.places.splice(index, 1);
      return [target, dbTalks.putProperty('users', createdBy,
                                          resp.data, resp.ref)];
    })
    .catch(function(err) {
      throw new Error(err);
    })
}

function getStats(target, prevResp, resp) {
  console.log('getting stats');
  return [target, dbTalks.getProperty('stats', 'counts')];
}

function updateStatsRemove(target, resp) {
  var placeCount = resp.data.placeCount;
  resp.data.placeCount = placeCount - 1;
  return dbTalks.putProperty('stats', 'counts', resp.data, resp.ref);
}


// Create a new user
app.post('/user/create', function(req, res, next) {
  var r = req.body;
  var uid = uuid();

  return Q.try(function() {
      return operations.createNewUser(r.username);
    })
    .catch(function(err) {
      return err;
    });

  /*
  return Q.try(function() {
      return [aUser, dbTalks.getProperty('users', aUser.username)]
    })
    .spread(checkUserAvailability)
    .then(getUserStats)
    .then(updateUserStats)
    .then(function(resp) {
      return res.send(aUser.apikeys[0]);
    })
    .catch(function(err) {
      return res.send('Failed to create user. ' + err);
    })
    */
});

/*
function checkUserAvailability(aUser, resp) {
  if (resp.data == 'NOT FOUND') {
    return dbTalks.putProperty('users', aUser.username, aUser);
  } 
  else {
    throw new Error('Username already used');
  }
}

function getUserStats(response) {
  return dbTalks.getProperty('stats', 'counts');
}

function updateUserStats(response) {
  var userCount = response.data.userCount;
  response.data.userCount = userCount + 1;
  return dbTalks.putProperty('stats', 'counts', response.data, response.ref);
}
*/

// Delete a user
app.post('/user/remove', function(req, res, next) {
  var r = req.body;
  /*
  var target = {
    username: r.username,
    apikey: r.apikey
  };
  */

  return Q.try(function() {
      return operations.deleteUser(r.username, r.apikey);
    })
    .catch(function(err) {
      return err;
    });
  /*
  return Q.try(function() {
      return [target, dbTalks.getProperty('users', target.username)]
    })
    .spread(checkUserAPIkeys)
    .spread(removeUser)
    .then(getUserStats)
    .then(decreaseUserStats)
    .then(function(resp) {
      return res.send('User removed');
    })
    .catch(function(err) {
      return res.send('Failed to delete user. ' + err);
    })
    */
});

/*
function checkUserAPIkeys(target, resp) {
  if (resp.data.apikeys.indexOf(target.apikey) > -1) {
    console.log('key recognized');
    return [target, resp, true];
  }
  else
    throw new Error('API key not recognized.');
}

function removeUser(target, prevResp, resp) {
  if (resp === true)
    return dbTalks.removeProperty('users', target.username);
  else
     throw new Error('API keys unknown');
}

function decreaseUserStats(resp) {
  var userCount = resp.data.userCount;
  resp.data.userCount = userCount - 1;
  return dbTalks.putProperty('stats', 'counts', resp.data, resp.ref);
}
*/

// Generate new API key
app.post('/user/gen-apikey', function(req, res, next) {
  var r = req.body;
  /*
  var target = {
    username: r.username,
    apikey: r.apikey
  };
  */

  return Q.try(function() {
      return operations.generateNewAPI(r.username, r.apikey);
    })
    .catch(function(err) {
      return err;
    });

  /*
  return Q.try(function() {
      return [target, dbTalks.getProperty('users', target.username)]
    })
    .spread(checkUserAPIkeys)
    .spread(addNewAPIkey)
    .spread(updatePlaces)
    .then(function(apikey) {
      return res.send(apikey);
    })
    .catch(function(err) {
      res.send('Error: ' + err);
    });
    */
});

/*
function addNewAPIkey(target, prevResp, resp) {
  if (resp === true) {
    var newKey = uuid();
    prevResp.data.apikeys.push(newKey);
    return [newKey, prevResp, dbTalks.putProperty('users', target.username,
                                        prevResp.data, prevResp.ref)];
  }
  else
    throw new Error('API not recognized');
}

function updatePlaces(apikey, user, resp) {
  for (var i = 0; i < user.data.places.length; i++) {
    console.log('adding to ' + user.data.places[i]);
    Q.try(function() {
      return dbTalks.getProperty('placeid', user.data.places[i]);
    })
    .then(function(response) {
      return dbTalks.getProperty('places', response.data.id);
    })
    .then(function(response) {
      response.data.apikeys.push(apikey);
      return dbTalks.putProperty('places', response.data.id,
                                 response.data, response.ref);
    })
    .catch(function(err) {
      console.log('Error:', err);
    });
  }
  return apikey;
}
*/

// Get stats data
app.get('/stats', function(req, res, next) {
  return dbTalks.getProperty('stats', 'counts')
    .then(function(resp) {
      return res.send(resp.data);
    })
    .fail(function(resp) {
      return res.send('CANT FETCH STATS');
    })
});

// Set stats data
app.post('/stats/set', function(req, res, next) {
  var r = req.body;

  var counts = {
    idCounter: parseInt(r.idCounter),
    placeCount: parseInt(r.placeCount),
    userCount: parseInt(r.userCount)
  };

  return Q.try(function() {
      return [counts, dbTalks.getProperty('stats', 'counts')]
    })
    .spread(checkUpdateStats) 
    .then(function(response) {
      if (response == true)
        return res.send('stats set successfully');
      else
        return res.send('failed to set stats');
    })
    .catch(function(error) {
      return res.send('Error: ' + error);
    })
});

function checkUpdateStats(counts, response) {
  if (typeof counts.idCounter == 'number')
    response.data.idCounter = counts.idCounter;
  if (typeof counts.placeCount == 'number')
    response.data.placeCount = counts.placeCount;
  if (typeof counts.userCount == 'number')
    response.data.userCount = counts.userCount;

  return dbTalks.putProperty('stats', 'counts',
                             response.data, response.ref);
}


// Start the server
var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});

exports.app = app;
