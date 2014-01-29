'use strict';

process.env.NODE_ENV = 'test';

var expect       = require('expect.js'),
    testRequests = require('../index');

describe("Test-requests middleware", function() {

  describe("registerHandlers()", function() {

    var cleanDB = function() {};

    it("registers the given handler functions", function() {
      expect(testRequests.registeredHandlers.clean_db).to.be(undefined);
      testRequests.registerHandlers({clean_db: cleanDB});
      expect(testRequests.registeredHandlers.clean_db).to.be(cleanDB);
    });

  });
});
