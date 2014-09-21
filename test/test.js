var request = require('supertest'),
    app = require('../server').app;

var r = '{"place":"AAA","location":"xyz","coordinates":[123,58],"status":true}';

describe('GET /place/p1', function() {
  it('respond with json', function(done) {
    this.timeout(4000);
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
