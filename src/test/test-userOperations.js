/* jshint expr:true */
/* global describe, it */

var userOperations = require('../helpers/userOperations');
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
var newKey, newKey2;
var idCounter, placeCount, userCount;

const DURATION = 25000;

describe('Preparing for test...', function() {
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

  it('creating a default user', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return dbTalks.putProperty('users', username1, aUser);
    })
    .then(function(resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('Statiscits', function() {
  it('should initialize stats', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.initializeStats();
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('values should be 0', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return dbTalks.getProperty('stats', 'counts');
    })
    .then(function(resp) {
      resp.data.idCounter.should.be.exactly(0);
      resp.data.placeCount.should.be.exactly(0);
      resp.data.userCount.should.be.exactly(0);
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('username availability check', function() {
  it('username should not be available', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.usernameAvailability(username1);
    })
    .spread(function(extras, resp) {
      resp.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('username should be available', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.usernameAvailability(username2);
    })
    .spread(function(extras, resp) {
      resp.should.be.true;
      return done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});


var username3 = 'fakeuser' + parseInt(Math.random()*1000);

describe('register user', function() {
  it('user should be created', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      // checking username availability before creating new user
      return userOperations.usernameAvailability(username3);
    })
    .spread(function(extras, resp) {
      if (resp === true) {
        return userOperations.createNewUser(username3);
      }
      else {
        return resp;
      }
    })
    .then(function(resp) {
      newKey2 = resp.key;
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('user should not be created', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.usernameAvailability(username1);
    })
    .spread(function(extras, resp) {
      resp.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('delete user', function() {
  it('user should be deleted', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.deleteUser(username3, newKey2);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('user should not be found', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.usernameAvailability(username3);
    })
    .spread(function(extras, resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('verify user public api key', function() {
  it('key verification should pass', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.verifyUserKey(username1, key2);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('key verification should fail', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.verifyUserKey(username1, 'xxxx');
    })
    .then(function(resp) {
      resp.success.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('generate new API key', function() {
  it('new API key should be added', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.generateNewAPI(username1, key2);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      newKey = resp.key;
      resp.key.should.have.length(36);
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('new API key should not be added due to wrong key', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.generateNewAPI(username1, 'xxxx');
    })
    .then(function(resp) {
      resp.success.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('new API key should not be added due to unknown user', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.generateNewAPI(username2, 'xxxx');
    })
    .then(function(resp) {
      resp.should.have.property('error');
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});


var username4 = 'fakeuser' + parseInt(Math.random()*1000);

describe('Rename user', function() {
  it('rename should be successful', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.renameUser(username1, username4, newKey);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('username should not be found', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.usernameAvailability(username1);
    })
    .spread(function(extras, resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('username should be found', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.usernameAvailability(username4);
    })
    .spread(function(extras, resp) {
      resp.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('revoke an API key', function() {
  it('should revoke a previously generated API key', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.revokeKey(username4, newKey);
    })
    .then(function(resp) {
      resp.success.should.be.true;
      resp.key.should.have.length(36);
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('should fail to revoke due to unknown key', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.revokeKey(username4, 'xxxx');
    })
    .then(function(resp) {
      resp.success.should.be.false;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('should fail to revoke due to unknown user', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return userOperations.revokeKey(username2, 'xxxx');
    })
    .then(function(resp) {
      resp.should.have.property('error');
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });
});

describe('Tests completed. Cleaning up...', function() {
  it('removing the default user', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return dbTalks.removeProperty('users', username4);
    })
    .then(function(resp) {
      resp.should.be.true;
      done();
    })
    .catch(function(err) {
      return done(err);
    });
  });

  it('deleting created user', function(done) {
    this.timeout(DURATION);
    Q.try(function() {
      return dbTalks.removeProperty('users', username3);
    })
    .then(function(resp) {
      resp.should.be.true;
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
