
var request = require('supertest');
var should = require('should');
var utls = require('lockit-utils');

var config = require('./app/config.js');
var app = require('./app/app.js');

var db = utls.getDatabase(config);
var adapter = require(db.adapter)(config);

var _config = JSON.parse(JSON.stringify(config));
_config.port = 9100;
_config.forgotPassword.tokenExpiration = '1 hour';
_config.forgotPassword.route = '/cannot-remember';
var _app = app(_config);

describe('#custom routes', function() {

  before(function(done) {
    adapter.save('routes', 'routes@email.com', 'password', function() {
      adapter.find('name', 'routes', function(err, user) {
        user.emailVerified = true;
        adapter.update(user, done);
      });
    });
  });

  describe('GET /forgot-password', function() {

    it('should work with custom routes', function(done) {
      request(_app)
        .get('/cannot-remember')
        .end(function(err, res) {
          res.statusCode.should.equal(200);
          res.text.should.containEql('<div class="panel-heading">Forgot password</div>');
          res.text.should.containEql('<title>Forgot password</title>');
          done();
        });
    });

  });

  describe('POST /forgot-password', function() {

    it('should work with custom routes', function(done) {
      request(_app)
        .post('/cannot-remember')
        .send({email: 'routes@email.com'})
        .end(function(error, res) {
          res.statusCode.should.equal(200);
          res.text.should.containEql('Email with link for password reset sent.');
          done();
        });
    });

  });

  describe('GET /forgot-password/:token', function() {

    it('should work with custom routes', function(done) {
      adapter.find('name', 'routes', function(err, user) {
        request(_app)
          .get('/cannot-remember/' + user.pwdResetToken)
          .end(function(err, res) {
            res.text.should.containEql('Create a new password');
            done();
          });
      });
    });

  });

  describe('POST /forgot-password/:token', function() {

    it('should work with custom routes', function(done) {
      adapter.find('name', 'routes', function(err, user) {
        request(_app)
          .post('/cannot-remember/' + user.pwdResetToken)
          .send({password: 'new Password'})
          .end(function(err, res) {
            res.statusCode.should.equal(200);
            res.text.should.containEql('You have successfully changed your password');
            done();
          });
      });
    });

  });

  after(function(done) {
    adapter.remove('routes', done);
  });

});
