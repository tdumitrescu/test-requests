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

    var myHandler = function() {};

    it('registers the given handler functions', function() {
      expect(testRequests.registeredHandlers.my_handler).to.be(undefined);
      testRequests.registerHandlers({my_handler: myHandler});
      expect(testRequests.registeredHandlers.my_handler).to.be(myHandler);
    });

  });

  describe('request-processing', function() {

    var PORT           = 3434,
        SERVER_URL     = 'http://localhost:' + PORT + '/',
        TEST_BASE_URL  = SERVER_URL + '_test/',
        MY_HANDLER_URL = TEST_BASE_URL + 'my_handler';

    describe('when not in the test environment', function() {

      var testServer = reloadServerInEnv('not_test');

      before(function(done) {
        testServer.startServer(PORT, '/', done);
      });

      after(function(done) {
        testServer.stopServer(done);
      });

      it('passes along all requests without processing', function(done) {
        request(MY_HANDLER_URL, function(error, response, body) {
          expect(body).to.match(/Default response/);
          done();
        });
      });

    });

    describe('when in the test environment', function() {
      var testServer = reloadServerInEnv('test'),
          withHandlerResponse = function(done, cb) {
            request(MY_HANDLER_URL, function(error, response, body) {
              cb(response, body, error);
              done();
            });
          };

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
            my_handler: function() {
              x = 5;
            }
          });
        });

        it('calls the handler', function(done) {
          expect(x).to.be(null);
          withHandlerResponse(done, function() {
            expect(x).to.be(5);
          });
        });

        it('reponds successfully', function(done) {
          withHandlerResponse(done, function(response) {
            expect(response.statusCode).to.be(200);
          });
        });
      });

      describe('when a return value is given', function() {
        var registerHandlerToReturn = function(returnVal) {
          testServer.testRequests.registerHandlers({
            my_handler: function() {
              return returnVal;
            }
          });
        };

        it('responds with a String', function(done) {
          registerHandlerToReturn("Cleaned DB");
          withHandlerResponse(done, function(response, body) {
            expect(body).to.match(/Cleaned DB/);
          });
        });

        it('responds with a JSON object', function(done) {
          registerHandlerToReturn({fixtures: ['object1', 'object2']});
          withHandlerResponse(done, function(response, body) {
            expect(JSON.parse(body).fixtures[0]).to.eql('object1');
          });
        });

        it('responds with a JSON array', function(done) {
          registerHandlerToReturn(['object1', 'object2']);
          withHandlerResponse(done, function(response, body) {
            expect(JSON.parse(body)[0]).to.eql('object1');
          });
        });
      });

      describe('when the handler uses a done() callback for asynchronous operations', function() {
        var y;

        beforeEach(function(done) {
          y = null;
          testServer.testRequests.registerHandlers({
            my_handler: function(req, res, trDone) {
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
          withHandlerResponse(done, function() {
            expect(y).to.be(17);
          });
        });

        it('responds with a return value when given', function(done) {
          withHandlerResponse(done, function(response, body) {
            expect(JSON.parse(body).newY).to.eql(17);
          });
        });

        it('provides access to the request and response objects', function(done) {
          withHandlerResponse(done, function(response) {
            expect(response.headers["set-cookie"]).to.eql(["user_id=10"]);
          });
        });
      });
    });
  });
});
