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
        TEST_BASE_URL = 'http://localhost:' + PORT + '/_test/',
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

      describe('when requesting an unregistered test handler', function() {
        it('404s', function(done) {
          request(TEST_BASE_URL + 'bla', function(error, response, body) {
            expect(response.statusCode).to.be(404);
            done();
          });
        });
      });

    });

  });
});
