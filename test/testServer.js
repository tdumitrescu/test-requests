var connect      = require('connect'),
    http         = require('http'),
    testRequests = require('../index');

var app = module.exports = connect(),
    server;

app.use(testRequests);
app.use(function(req, res) {
  res.end('Default response');
});

module.exports.startServer = function(port, path, callback) {
  server = http.createServer(app).listen(port, function() {
    callback();
  });
};

module.exports.stopServer = function(callback) {
  server.close(callback);
};
