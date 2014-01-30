'use strict';

process.env.NODE_ENV = 'test';

var expect       = require('expect.js'),
    request      = require('request'),
    testRequests = require('../index');

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

    var PORT         = 3434,
        CLEAN_DB_URL = 'http://localhost:' + PORT + '/_test/clean_db';

    describe('when not in the test environment', function() {

      process.env.NODE_ENV = 'not_test';
      var testServer = require('./testServer');

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

  });
});
