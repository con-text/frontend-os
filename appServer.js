var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var routes = require('./server/appServerRoutes.js');
var config = require('./config/config');
var socketClient = require('socket.io-client')(config.baseApiUrl);
// var socketClient = require('socket.io-client')('http://contexte.herokuapp.com');

app.use(config.allowAppsOrigin);
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get('/', routes.root);
app.get('/app/:uuid/:appId', routes.getApp);
app.get('/app/:uuid/:appId/states/:objectId', routes.getAppWithObject);
app.get('/users/:uuid/apps/:appId/states', routes.getOrCreateState);
app.get('/object/:uuid/:objectId', routes.getObject);

// Allow to serve assets, like css or images
app.get('/apps/:appName/:asset', function(req, res) {
  var appName = req.params.appName;
  var fileName = req.params.asset;

  res.sendFile(fileName, { root: './dist/apps/'+ appName + '/' });
});

// app.get('/syncState/:uuid/:appId', routes.syncGet);
// app.post('/syncState/:uuid/:appId', routes.syncPost);

var server = app.listen(3001, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

var io = require('socket.io')(server);

var currentUser;
var socketIdToObject = {};
var currentObjects = {};

socketClient.on('connect', function(){
	console.log("Connected to backend socketClient");
});


socketClient.on('disconnect', function(){
    //backend disconects, wipe the connection so that
    console.log("Backend has disconnected");
    currentUser = null;
});


socketClient.on('syncedState', function(msg){
	//got syncedState from the server, send to the saved object
    if(currentObjects[msg.objectId]){
        currentObjects[msg.socketId].emit('syncedState', msg);
    }
    else{
        console.log("Object doesn't exist in currentObjects");
    }
});

function socketCanRun(){
    return (!!currentUser);
}

// Need to define something using
io.on('connection', function(socket){

	socketClient.on('gotInitialFromBackend', function(msg){

        if(!msg.objectId || !msg.state){
            console.log("Message from backend is missing object id or state");
            return;
        }
		clients[msg.objectId].emit('fillData', msg.state);
	});

	socket.on('stateChange', function(msg){
		socketClient.emit('stateChange',
			{	uuid: msg.uuid, objectId: msg.objectId, action:msg.action,
				path: msg.path, property: msg.property, value: msg.value});
	});

	socket.on('getInitial', function(msg){
        //new object has joined the room, check that it doesn't already exist
        if(currentObjects[msg.objectId]){
            console.log("state already exists in the object");
            return;
        }
        //create the mappings between objectid and socketid
        //the socketIdToObject will be used on disconnect
        currentObjects[msg.objectId] = socket;
        socketIdToObject[socket.id] = msg.objectId;


		var packet = {uuid: msg.uuid, objectId: msg.objectId, socketId: socket.id};

		socketClient.emit('getInitialFromBackend', packet);
	});

  socket.on('disconnect', function() {
      //if this exists, its an object, otherwise its the connection from 5000
      if(socketIdToObject[socket.id]){
          console.log("Removing",socketIdToObject[socket.id]);
          delete currentObjects[socketIdToObject[socket.id]];
          delete socketIdToObject[socket.id];
      }

  });

  socket.on('initRoom', function(data) {
      //logged into the system, let the backend know so that it can map
      //uuid to a socket object
      if(data.uuid){
          console.log("Joining",data.uuid);
          socketClient.emit('initRoom', {uuid: data.uuid});
          currentUser = data.uuid;
      }
      else{
          console.log("UUID didn't exist in the ");
      }
  });

  socket.on('leaveRoom', function() {
      socketClient.emit('leaveRoom', {uuid: currentUser});
      console.log("Leave room");
  });
});
