var request = require('supertest'),
    app = require('../server').app;

var r = '{"place":"AAA","location":"xyz","coordinates":[123,58],"status":true}';

describe('GET /place/p1', function() {
  it('respond with json', function(done) {
    this.timeout(15000);
    request(app)
      .get('/place/p1')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(r)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  })
});

describe('POST /place/create', function() {
  it('create a new place', function(done) {
    this.timeout(15000);
    request(app)
      .post('/place/create')
      .send({ name: 'cakewalk', location: 'moose', coordinates: '45,12',
              apikey: 1111 })
      .expect('place created successfully')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
});

describe('POST /place/remove', function() {
  it('delete a place', function(done) {
    this.timeout(15000);
    request(app)
      .post('/place/remove')
      .send({ name: 'cakewalk', apikey: 1111 })
      .expect('{\"message\":\"item deleted\"}')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
});
