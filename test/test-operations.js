var operations = require('../helpers/operations');
var dbTalks = require('../helpers/dbTalks');
var Q = require('q');
var uuid = require('node-uuid');

var username1 = 'fakeuser' + parseInt(Math.random()*1000);
var username2 = 'fakeuser' + parseInt(Math.random()*1000);
var key1 = uuid();
var key2 =  uuid();
var aUser = {
  username: username1,
  privateKey: key1,
  publicKey: [key2],
  places: []
};

describe('Preparing for test...', function() {
  it('creating a default user', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return dbTalks.putProperty('users', username1, aUser);
    })
    .then(function(resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });
});

describe('username availability check', function() {
  it('username should not be available', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return operations.usernameAvailability(username1);
    })
    .spread(function(extras, resp) {
      resp.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });

  it('username should be available', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return operations.usernameAvailability(username2);
    })
    .spread(function(extras, resp) {
      resp.should.be.true;
      return done();
    })
    .catch(function(err) {
      return done(err);
    })
  });
});


var username3 = 'fakeuser' + parseInt(Math.random()*1000);

describe('register user', function() {
  it('user should be created', function(done) {
    this.timeout(25000);
    Q.try(function() {
      // checking username availability before creating new user
      return operations.usernameAvailability(username3);
    })
    .spread(function(extras, resp) {
      if (resp === true) {
        return operations.createNewUser(username3);
      }
      else {
        return resp;
      }
    })
    .spread(function(extra, resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });

  it('user should not be created', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return operations.usernameAvailability(username1);
    })
    .spread(function(extras, resp) {
      resp.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });
});

describe('verify user public api key', function() {
  it('key verification should pass', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return operations.verifyUserKey(username1, key2);
    })
    .spread(function(extra, resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });

  it('key verification should fail', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return operations.verifyUserKey(username1, 'xxxx');
    })
    .spread(function(extra, resp) {
      resp.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });
});

describe('generate new API key', function() {
  it('new API key should be added', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return operations.generateNewAPI(username1, key2);
    })
    .spread(function(extras, resp) {
      resp.should.be.true;
      extras.should.have.length(36);
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });

  it('new API key should not be added due to wrong key', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return operations.generateNewAPI(username1, 'xxxx');
    })
    .spread(function(extras, resp) {
      resp.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });

  it('new API key should not be added due to unknown user', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return operations.generateNewAPI(username2, 'xxxx');
    })
    .spread(function(extras, resp) {
      resp.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });
});

describe('Tests completed. Cleaning up...', function() {
  it('removing the default user', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return dbTalks.removeProperty('users', username1);
    })
    .then(function(resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });

  it('removing created user', function(done) {
    this.timeout(25000);
    Q.try(function() {
      return dbTalks.removeProperty('users', username3);
    })
    .then(function(resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    })
  });
});
