/* jshint expr:true */
/* global describe, it */

var request = require('supertest'),
    app = require('../server').app;

var username = 'nyancat' + parseInt(Math.random()*1000);
var apikey;

// Tests on user account
describe('Create new user', function() {
  it('POST /user/create', function(done) {
    this.timeout(15000);
    request(app)
      .post('/user/create')
      .send({ username: username })
      .expect(200)
      .expect(function(res) {
        apikey = res.body.key;
        apikey.should.have.length(36);
      })
      .end(done);
  });
});

describe('Create a duplicate user', function() {
  it('POST /user/create', function(done) {
    this.timeout(15000);
    request(app)
      .post('/user/create')
      .send({ username: username })
      .expect(200)
      .expect(function(res) {
        res.body.should.have.property('error');
      })
      .end(done);
  });
});


// Tests on places

var placeName = 'cakewalk' + parseInt(Math.random()*1000);

describe('Create a new place', function() {
  it('POST /place/create', function(done) {
    this.timeout(15000);
    request(app)
      .post('/place/create')
      .send({ name: placeName, location: 'moose', coordinates: '45,12',
              apikey: apikey, username: username })
      .expect(200)
      .expect(function(res) {
        res.body.success.should.be.true;
        res.body.placeId.should.be.a.Number;
      })
      .end(done);
  });
});

/*
describe('Query a place', function() {
  it('GET /place/' + placeName, function(done) {
    this.timeout(15000);
    request(app)
      .get('/place/' + placeName)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(regexp)
      .end(done);
  })
});
*/

describe('Delete a place', function() {
  it('POST /place/remove', function(done) {
    this.timeout(15000);
    request(app)
      .post('/place/remove')
      .send({ name: placeName, username: username, apikey: apikey })
      .expect(200)
      .expect(function(res) {
        res.body.success.should.be.true;
      })
      .end(done);
  });
});

/*
// Tests on stats
var idCounter, placeCount, userCount; // store the defaults

describe('Get stats', function() {
  it('GET /stats', function(done) {
    this.timeout(15000);
    request(app)
      .get('/stats')
      .expect(200)
      .end(function(err, resp) {
        try {
          var r = JSON.parse(resp.text);
          idCounter = r.idCounter;
          placeCount = r.placeCount;
          userCount = r.userCount;
          done();
        } catch (err){
          done(err);
        }
      });
  })
});

describe('Set stats', function() {
  it('POST /stats/set', function(done) {
    this.timeout(15000);
    request(app)
      .post('/stats/set')
      .send({ idCounter: 2, placeCount: 1, userCount: 1 })
      .expect(200)
      .expect(/(?:stats set successfully)/)
      .end(done)
  });

  it('GET /stats', function(done) {
    this.timeout(15000);
    request(app)
      .get('/stats')
      .expect(200)
      .end(function(err, resp) {
        var r = JSON.parse(resp.text);
        try {
          if (r.idCounter !== 2)
            throw new Error('Wrong idCounter');
          else if (r.placeCount !== 1)
            throw new Error('Wrong placeCount');
          else if (r.userCount !== 1)
            throw new Error('Wrong userCount');
          done();
        } catch (err) {
          done(err);
        }
      })
  });
});

describe('Resetting stats', function() {
  it('POST /stats/set', function(done) {
    this.timeout(15000);
    request(app)
      .post('/stats/set')
      .send({ idCounter: idCounter, placeCount: placeCount,
              userCount: userCount })
      .expect(200)
      .expect(/(?:stats set successfully)/)
      .end(done)
  })
});
*/

describe('Delete user', function() {
  it('POST /user/remove', function(done) {
    this.timeout(15000);
    request(app)
      .post('/user/remove')
      .send({ username: username, apikey: apikey })
      .expect(200)
      .expect(function(res) {
        res.body.success.should.be.true;
      })
      .end(done);
  });
});

describe('Delete already deleted user', function() {
  it('POST /user/remove', function(done) {
    this.timeout(15000);
    request(app)
      .post('/user/remove')
      .send({ username: username, apikey: apikey })
      .expect(200)
      .expect(function(res) {
        res.body.success.should.be.false;
      })
      .end(done);
  });
});
