'use strict';

process.env.NODE_ENV = 'test';

var expect       = require('expect.js'),
    Path         = require('path'),
    request      = require('request'),
    trPath       = require.resolve(Path.resolve('index')),
    serverPath   = require.resolve('./testServer'),
    testRequests = require(trPath);

var reloadServerInEnv = function(env) {
  process.env.NODE_ENV = env;
  delete require.cache[trPath];
  delete require.cache[serverPath];
  return require('./testServer');
};

describe('Test-requests middleware', function() {

  describe('registerHandlers()', function() {

    var cleanDB = function() {};

    it('registers the given handler functions', function() {
      expect(testRequests.registeredHandlers.clean_db).to.be(undefined);
      testRequests.registerHandlers({clean_db: cleanDB});
      expect(testRequests.registeredHandlers.clean_db).to.be(cleanDB);
    });

  });

  describe('request-processing', function() {

    var PORT          = 3434,
        SERVER_URL    = 'http://localhost:' + PORT + '/',
        TEST_BASE_URL = SERVER_URL + '_test/',
        CLEAN_DB_URL  = TEST_BASE_URL + 'clean_db';

    describe('when not in the test environment', function() {

      var testServer = reloadServerInEnv('not_test');

      before(function(done) {
        testServer.startServer(PORT, '/', done);
      });

      after(function(done) {
        testServer.stopServer(done);
      });

      it('passes along all requests without processing', function(done) {
        request(CLEAN_DB_URL, function(error, response, body) {
          expect(body).to.match(/Default response/);
          done();
        });
      });

    });

    describe('when in the test environment', function() {

      var testServer = reloadServerInEnv('test');

      before(function(done) {
        testServer.startServer(PORT, '/', done);
      });

      after(function(done) {
        testServer.stopServer(done);
      });

      it('passes along non-test requests', function(done) {
        request(SERVER_URL + 'bla', function(error, response, body) {
          expect(body).to.match(/Default response/);
          done();
        });
      });

      it('404s when requesting an unregistered test handler', function(done) {
        request(TEST_BASE_URL + 'bla', function(error, response, body) {
          expect(response.statusCode).to.be(404);
          done();
        });
      });

      describe('when requesting a registered handler', function() {
        var x;

        beforeEach(function() {
          x = null;
          testServer.testRequests.registerHandlers({
            clean_db: function() {
              x = 5;
            }
          });
        });

        it('calls the handler', function(done) {
          expect(x).to.be(null);
          request(CLEAN_DB_URL, function(error, response, body) {
            expect(x).to.be(5);
            done();
          });
        });

        it('reponds successfully', function(done) {
          request(CLEAN_DB_URL, function(error, response, body) {
            expect(response.statusCode).to.be(200);
            done();
          });
        });
      });

      describe('when a return value is given', function() {
        var registerHandlerToReturn = function(returnVal) {
          testServer.testRequests.registerHandlers({
            clean_db: function() {
              return returnVal;
            }
          });
        };

        it('responds with String return values when handlers return strings', function(done) {
          registerHandlerToReturn("Cleaned DB");
          request(CLEAN_DB_URL, function(error, response, body) {
            expect(body).to.match(/Cleaned DB/);
            done();
          });
        });

        it('responds with JSON return values when handlers return objects', function(done) {
          var fixtures = {fixtures: ['object1', 'object2']};
          registerHandlerToReturn(fixtures);
          request(CLEAN_DB_URL, function(error, response, body) {
            expect(JSON.parse(body).fixtures[0]).to.eql('object1');
            done();
          });
        });

        it('responds with JSON return values when handlers return arrays', function(done) {
          var fixtures = ['object1', 'object2'];
          registerHandlerToReturn(fixtures);
          request(CLEAN_DB_URL, function(error, response, body) {
            expect(JSON.parse(body)[0]).to.eql('object1');
            done();
          });
        });
      });

      describe('when the handler uses a done() callback for asynchronous operations', function() {
        var y;

        beforeEach(function(done) {
          y = null;
          testServer.testRequests.registerHandlers({
            clean_db: function(req, res, trDone) {
              res.setHeader("Set-Cookie", "user_id=10");
              setTimeout(function() {
                y = 17;
                trDone({newY: y});
              }, 200);
            }
          });
          done();
        });

        it('responds after the handler has finished', function(done) {
          expect(y).to.be(null);
          request(CLEAN_DB_URL, function(error, response, body) {
            expect(y).to.be(17);
            done();
          });
        });

        it('responds with return values when given', function(done) {
          request(CLEAN_DB_URL, function(error, response, body) {
            expect(JSON.parse(body).newY).to.eql(17);
            done();
          });
        });

        it('provides access to the request and response objects', function(done) {
          request(CLEAN_DB_URL, function(error, response, body) {
            expect(response.headers["set-cookie"]).to.eql(["user_id=10"]);
            done();
          });
        });
      });
    });
  });
});
