var rest = require('restler');
var config = require('./../config/config');

function getUserProfile(userId, cbk, errCbk) {

  // Base API
  var baseUrl = config.baseApiUrl;

  // Call the service
  rest.get(baseUrl + '/users/' + userId)
  .on('success', function(data, response) {
    cbk(data.message);
  })
  .on('error', function(err, response) {
    console.error("Fail", err, response);
    errCbk({code: response.code});
  });
}

module.exports.getUserProfile = getUserProfile;

module.exports.routeHandler = function(app, bleSocket) {
  app.get('/user/:userId/profile', function(req, res) {

    var userId = req.params.userId;

    getUserProfile(userId, function(data) {
        res.json(data);
    }, function(err) {
      res.json(err.code, err.message);
    });

  });

  app.get('/user/:userId/buzz', function(req, res) {
    // Write data to the socket
    bleSocket.sendMessage({
      request: 'buzz',
      data: req.params.userId
    });
    res.sendStatus(200);
  });
};
