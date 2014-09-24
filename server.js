var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    Q = require('q'),
    config = require('./config.js'),
    db = require('orchestrate')(config.db),
    uuid = require('node-uuid'),
    dbTalks = require('./helpers/dbTalks'),
    utils = require('./helpers/utils');

var app = express();


app.use(morgan('combined'));
app.use(bodyParser.json());

app.get('/place/:id', function(req, res, next) {
  return dbTalks.getProperty('places', req.params.id)
    .then(function(response) {
      res.send(response.data);
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
    createdBy: r.user || 'unknown',
    id: '',
    apiKey: r.apikey || 'unknown',
    lastUpdated: 'unknown'
  };

  return Q.try(function() {
      return [aPlace, dbTalks.getProperty('stats', 'counts')]
    })
    .spread(incrementPlaceCount)
    .spread(createUniquePlace)
    .spread(updateStats)
    .then(function(resp) {
      if (resp == true)
        return res.send('place created');
      else
        return res.send('failed to create');
    })
    .catch(function(error) {
      console.log('ERROR: ' + error);
      return res.send(error);
    })
});

function incrementPlaceCount(aPlace, response) {
  var idCount = response.data.idCounter || 0;
  var placeCount = response.data.placeCount || 0;
  response.data.idCounter = idCount + 1;
  response.data.placeCount = placeCount + 1;
  aPlace.id = response.data.idCounter;
  return [aPlace, response, dbTalks.putProperty('places', aPlace.id, aPlace)]
}

function createUniquePlace(aPlace, countStatus, resp) {
  if (resp == true) {
    var uniquePlace = {
      place: aPlace.place,
      id: aPlace.id
    };
    return [countStatus,
            dbTalks.putProperty('placeid', aPlace.place, uniquePlace)];
  } else {
    return res.send('failed to create new place');
  }
}

function updateStats(countStatus, resp) {
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
    .then(getStats)
    .then(updateStatsRemove)
    .then(function(resp) {
      return res.send('place removed successfully');
    })
    .catch(function(error) {
      console.log('ERROR: ' + error);
      return res.send(error);
    })
});

function getPlaces(target, response) {
  return [target, dbTalks.getProperty('places', response.data.id)];
}

function verifyAPIkey(target, resp) {
  if (resp.data.apiKey == target.apikey) {
    return [target, dbTalks.removeProperty('places', resp.data.id)];
  }
}

function removePlaceid(target, resp) {
  return dbTalks.removeProperty('placeid', target.name);
}

function getStats(resp) {
  return dbTalks.getProperty('stats', 'counts');
}

function updateStatsRemove(resp) {
  var placeCount = resp.data.placeCount;
  resp.data.placeCount = placeCount - 1;
  return dbTalks.putProperty('stats', 'counts', resp.data, resp.ref);
}


// Create a new user
app.post('/user/create', function(req, res, next) {
  var r = req.body;
  var uid = uuid();

  var aUser = {
    username: r.username,
    apikeys: [uid]
  };

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
      console.log('ERROR: ' + err);
      return res.send('Failed to create user. ' + err);
    })
});

function checkUserAvailability(aUser, resp) {
  if (resp.data == 'NOT FOUND') {
    return dbTalks.putProperty('users', aUser.username, aUser);
  } 
  else {
    throw new Error('Username alredy used');
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


// Delete a user
app.post('/user/remove', function(req, res, next) {
  var r = req.body;
  var target = {
    username: r.username,
    apikey: r.apikey
  };

  return Q.try(function() {
      return [target, dbTalks.getProperty('users', target.username)]
    })
    .spread(checkUserAPIkeys)
    .then(getUserStats)
    .then(decreaseUserStats)
    .then(function(resp) {
      return res.send('User removed');
    })
    .catch(function(err) {
      console.log('ERROR: ' + err);
      return res.send('Failed to delete user. ' + err);
    })
});

function checkUserAPIkeys(target, resp) {
  if (resp.data.apikeys.indexOf(target.apikey) > -1) {
    return dbTalks.removeProperty('users', target.username);
  }
  else
    throw new Error('API key not recognized.');
}

function decreaseUserStats(resp) {
  var userCount = resp.data.userCount;
  resp.data.userCount = userCount - 1;
  return dbTalks.putProperty('stats', 'counts', resp.data, resp.ref);
}


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
      console.log('ERROR: ' + error);
      return res.send(error);
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
