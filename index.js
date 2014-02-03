'use strict';

var handleTestRequests, passThrough, requestHelper;

handleTestRequests = function(req, res, next) {
  var pathMatches = req.url.match(/^\/_test\/(.+)/);

  if (pathMatches === null) {
    return next();
  } else {
    var handler = requestHelper.registeredHandlers[pathMatches[1]];
    if (!!handler) {
      var handlerResult = handler();
      res.statusCode = 200;
      switch(typeof handlerResult) {
        case "object":
          res.end(JSON.stringify(handlerResult));
          break;
        case "string":
          res.end(handlerResult);
          break;
        default:
          res.end();
      }
    } else {
      res.statusCode = 404;
      res.end();
    }
  }
};

passThrough = function(req, res, next) {
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
