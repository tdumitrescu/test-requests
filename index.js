'use strict';

var handleTestRequests, passThrough, requestHelper;

handleTestRequests = passThrough = function(req, res, next) {
  return next();
};

requestHelper = process.env.NODE_ENV === "test" ? handleTestRequests : passThrough;

requestHelper.registerHandlers = function(handlers) {
  for (var name in handlers) {
    requestHelper.registeredHandlers[name] = handlers[name];
  }
};

requestHelper.registeredHandlers = {};

module.exports = requestHelper;
