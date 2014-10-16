/* jshint expr:true */
/* global describe, it */

var userOperations = require('../helpers/userOperations');
var placeOperations = require('../helpers/placeOperations');
var dbTalks = require('../helpers/dbTalks');
var Q = require('q');

var username1 = 'fakeuser' + parseInt(Math.random()*1000);
var token;
var idCounter, placeCount, userCount;
var placeName1 = 'fakeplace' + parseInt(Math.random()*1000);
var placeId1 = 'fakePlaceId' + parseInt(Math.random()*1000);
var placeId2;

const DURATION = 25000;

describe('Preparing for placeOperations test...', function() {
  it('backing up stats', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return dbTalks.getProperty('stats', 'counts');
    })
    .then(function(resp) {
      idCounter = resp.data.idCounter;
      idCounter.should.be.a.Number;

      placeCount = resp.data.placeCount;
      placeCount.should.be.a.Number;

      userCount = resp.data.userCount;
      userCount.should.be.a.Number;

      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('creating a new user', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.usernameAvailability(username1);
    })
    .spread(function(extras, resp) {
      if (resp) {
        return userOperations.createNewUser(username1);
      }
      else {
        return resp;
      }
    })
    .then(function(resp) {
      token = resp.key;
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('testing elementary units', function() {
  it('should get the next available place id', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return placeOperations.getNewPlaceId();
    })
    .then(function(resp) {
      return [resp.id, dbTalks.getProperty('stats', 'counts')];
    })
    .spread(function(actual, resp) {
      actual.should.be.exactly(resp.data.idCounter + 1);
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('register new place', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      var aPlace = {
        creator: username1,
        token: token,
        placeName: placeName1,
        location: 'knock knock',
        coordinates: '11.1, 32.1',
        tags: 'none',
        desc: 'foo foo',
        id: placeId1
      };
      return placeOperations.registerPlace(aPlace);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('deregister the registered place', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return placeOperations.deregisterPlace(placeId1);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('place counter should be incremented', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return placeOperations.incrementPlaceCount();
    })
    .then(function(resp) {
      resp.success.should.be.true;
      resp.placeCount.should.be.exactly(placeCount + 1);
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('place counter should be decremented', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return placeOperations.decrementPlaceCount();
    })
    .then(function(resp) {
      resp.success.should.be.true;
      resp.placeCount.should.be.exactly(placeCount);
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('create place', function() {
  it('place should be created', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      var place = {
        creator: username1,
        token: token,
        placeName: 'express hub',
        location: 'node land',
        coordinates: '23.34, 12.11',
        tags: 'none',
        desc: 'foo bar'
      };
      return placeOperations.createPlace(place);
    })
    .then(function(resp) {
      placeId2 = resp.placeId;
      resp.success.should.be.true;
      resp.placeId.should.be.exactly(idCounter + 2);
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('delete place', function() {
  it('place should be deleted', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      var aPlace = {
        id: placeId2
      };
      return placeOperations.deletePlace(aPlace);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('Tests completed. Cleaning up...', function() {
  it('removing the created user', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.deleteUser(username1, token);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('restoring stats', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      var statsVal = {
        idCounter: idCounter,
        placeCount: placeCount,
        userCount: userCount
      };
      return userOperations.setStats(statsVal);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});
