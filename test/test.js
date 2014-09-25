var request = require('supertest'),
    app = require('../server').app;

var username = 'nyancat27';
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
        apikey = res.text;
        if (res.text.length !== 36)
          throw new Error('apikey length is not 36');
      })
      .end(done);
  })
});

describe('Create a duplicate user', function() {
  it('POST /user/create', function(done) {
    this.timeout(15000);
    request(app)
      .post('/user/create')
      .send({ username: username })
      .expect(200)
      .expect(/(?:Username alredy used)/)
      .end(done);
  })
})

describe('Delete user', function() {
  it('POST /user/remove', function(done) {
    this.timeout(15000);
    request(app)
      .post('/user/remove')
      .send({ username: username, apikey: apikey })
      .expect(200)
      .expect(/(?:User removed)/)
      .end(done);
  })
});

describe('Delete already deleted user', function() {
  it('POST /user/remove', function(done) {
    this.timeout(15000);
    request(app)
      .post('/user/remove')
      .send({ username: username, apikey: apikey })
      .expect(200)
      .expect(/(?:Failed to delete user)/)
      .end(done);
  })
});


// Tests on places

var placeName = 'cakewalk';
var regexp = new RegExp('(?:' + placeName + ')');

describe('Create a new place', function() {
  it('POST /place/create', function(done) {
    this.timeout(15000);
    request(app)
      .post('/place/create')
      .send({ name: placeName, location: 'moose', coordinates: '45,12',
              apikey: apikey })
      .expect(/(?:Place created)/)
      .expect(200)
      .end(done);
  })
});

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

describe('Delete a place', function() {
  it('POST /place/remove', function(done) {
    this.timeout(15000);
    request(app)
      .post('/place/remove')
      .send({ name: placeName, apikey: apikey })
      .expect(/(?:place removed)/)
      .expect(200)
      .end(done);
  })
});


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
