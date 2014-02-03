'use strict';

var handleTestRequests, passThrough, requestHelper, sendHandlerResponse;

handleTestRequests = function(req, res, next) {
  var pathMatches = req.url.match(/^\/_test\/(.+)/);

  if (pathMatches === null) {
    return next();
  } else {
    var handler = requestHelper.registeredHandlers[pathMatches[1]];
    if (!!handler) {
      if (handler.length > 0) {
        // ASYNC: handler uses done() callback
        handler(function(handlerResult) {
          sendHandlerResponse(res, handlerResult);
        });
      } else {
        // SYNC: no callback expected
        sendHandlerResponse(res, handler());
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

sendHandlerResponse = function(res, handlerResult) {
  res.statusCode = 200;
  switch(typeof handlerResult) {
    case "object":
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(handlerResult));
      break;
    case "string":
      res.end(handlerResult);
      break;
    default:
      res.end();
  }
}

requestHelper = process.env.NODE_ENV === "test" ? handleTestRequests : passThrough;

requestHelper.registerHandlers = function(handlers) {
  for (var name in handlers) {
    requestHelper.registeredHandlers[name] = handlers[name];
  }
};

requestHelper.registeredHandlers = {};

module.exports = requestHelper;
