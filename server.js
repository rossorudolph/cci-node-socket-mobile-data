// Create dictionaries for tracking hosts, clients, and rooms
let hosts   = {};
let clients = {};
let rooms   = {};

////////////
// Setup express web server and listen on port 3000
let express = require('express');
let app = express();
let port = Number(process.env.PORT || 3000);
let server = app.listen(port);

app.use(express.static('public'));
console.log("My socket server is running on port " + port);

////////////
// Start socket.io with CORS configuration
let socket = require('socket.io');

// Connect it to the web server with proper CORS settings
let io = socket(server, {
  cors: {
    origin: "*", // In production, specify your domain like "http://localhost:3000"
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ['websocket', 'polling'], // Allow both transport methods
  allowEIO3: true // Backwards compatibility
});

////////////
// Setup a connection
io.sockets.on('connection', newConnection);

function newConnection(socket) {
  // Inform incoming connection of its ID
  console.log('\n' + socket.id + ' is attempting connection...');
  socket.emit('id', socket.id);

  // Process a request to join.
  socket.on('join', function (data) {
    console.log('Join request received:', data);

    // If request is from a client...
    if (data.name == 'client') {
      console.log("Verifying client...");

      // If the roomId field is not null
      if (data.roomId != null) {
        // Search existing roomIds for a match
        console.log("Searching for existing room ID...");
        if (rooms[data.roomId] != null) {

          // Add client to room with all connected clients 
          socket.join(data.name);

          // Add client and corresponding data to clients dictionary 
          // by socket ID
          clients[socket.id] = {
            type: data.name, 
            roomId: data.roomId
          }

          // Add client to its own room and to host room by room ID
          socket.join([socket.id, data.roomId]);
          console.log('Client added to room '+data.roomId+'.\tNumber of clients: ' + Object.keys(clients).length);

          // Send match confirmation back to client
          socket.emit("found", {status: true});
        }
        else {
          // Notify client of failure to match
          console.log('Room not found:', data.roomId);
          socket.emit("found", {status: false});
        }
      }
    } 
    else if (data.name == 'host') {
      // If the attempted connection is from a host...

      // Store a transmitted room ID if it exists, otherwise
      // generate a random gemstone name as room ID.
      let roomId = null;
      if (data.roomId === null || data.roomId === 'undefined' || !data.roomId) {
        roomId = makeIdFromList();
      }
      else {
        roomId = data.roomId;
      }

      // Add client and corresponding data to devices dictionary 
      // by socket ID
      let hostData = {
        type: data.name,
        roomId: roomId
      };

      hosts[socket.id] = hostData;
      rooms[roomId] = socket.id;

      // Add host to "host" room, its own room by room ID, and to a room 
      // with its clients by room ID.
      socket.join([data.name, 'host:'+hostData.roomId, hostData.roomId]);

      // Send clients room ID back to host
      socket.emit("hostConnect", hostData);

      console.log('Host added with room ID of ' + hostData.roomId + '.\tNumber of hosts: ' + Object.keys(hosts).length);
    } 
    else {
      console.log('warning: data type not recognized.', data);
    }
  });

  //// Process device disconnects.
  socket.on('disconnect', function (reason) {
    console.log('\n' + socket.id + ' has been disconnected! Reason:', reason);

    if (clients[socket.id] != null) {
      // If the device is a client, delete it
      let roomId = clients[socket.id].roomId;
      delete clients[socket.id];
      console.log('Client removed.\tNumber of clients: ' + Object.keys(clients).length);

      // Notify hosts that client has disconnected.
      socket.to('host:' + roomId).emit('clientDisconnect', {id: socket.id});
    } 
    else if (hosts[socket.id] != null) {
      // If the device is a host, delete it
      let roomId = hosts[socket.id].roomId;
      delete hosts[socket.id];
      console.log('Host with ID ' + roomId + ' removed.\tNumber of hosts: ' + Object.keys(hosts).length);

      // Remove corresponding room
      let key = getKeyByValue(rooms, socket.id);
      if (key != null) {
        delete rooms[key];
      }

      // Notify all clients in the room that host disconnected
      socket.to(roomId).emit('hostDisconnect', {roomId: roomId});
    }
  });

  //// Process client connects.
  socket.on('clientConnect', onClientConnect);

  function onClientConnect(data) {
    if (rooms[data.roomId] != null) {
      console.log('clientConnect message received from ' + socket.id + ' for room ' + data.roomId + ".");
      socket.to('host:'+data.roomId).emit('clientConnect', {id: socket.id, roomId: data.roomId});
    }
  }
  
  //// Reroute data sent between clients and hosts
  socket.on('sendData', sendData);

  function sendData(data) {
    let packet = {...data};
    packet.id = socket.id;
    
    // If room ID is valid...
    if (rooms[data.roomId] != null) {
      if (clients[socket.id] != null) {
        // And if device is a client, send to corresponding host
        socket.to('host:'+data.roomId).emit('receiveData', packet);
      }
      else if (hosts[socket.id] != null) {
        // And if device is a host, send to corresponding clients
        socket.to(data.roomId).emit('receiveData', packet);
      }
    }
  }

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error for', socket.id, ':', error);
  });
}

////////////
// Utility Functions
function searchRoomId(roomId_, array_) {
  for (let i = 0; i < array_.length; i++) {
    if (array_[i].roomId == roomId_) {
      return {
        item: array_[i],
        index: i
      };
    }
  }
  return null;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

////////////
// Gemstone room ID generator
const roomNames = [
  "agate", "amber", "amethyst", "barite", "beryl", "bloodstone", "coral", 
  "crystal", "diamond", "emerald", "fluorite", "garnet", "goldstone", 
  "jade", "jasper", "moonstone", "onyx", "opal", "pearl", "peridot", 
  "quahog", "quartz", "ruby", "sapphire", "sardonyx", "sunstone", 
  "tigereye", "topaz", "turquoise", "zircon"
];

const roomIds = randomNoRepeats(roomNames);

function randomNoRepeats(array) {
  let copy = array.slice(0);
  return function() {
    if (copy.length < 1) { copy = array.slice(0); }
    let index = Math.floor(Math.random() * copy.length);
    let item = copy[index];
    copy.splice(index, 1);
    return {id: item, length: copy.length};
  };
}

function makeIdFromList() {
  for (let i = 0; i < roomNames.length; i++) {
    let text = roomIds().id;
    let room = searchRoomId(text, Object.values(hosts));
    if (room == null) {
      return text;
    }
  }
  console.log(Object.keys(hosts).length + " hosts detected. No names available.");
  return null;
}