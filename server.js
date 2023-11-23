const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerServer);

app.get('/', (req, rsp) => {
  rsp.redirect(`/${uuidv4()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

app.get('/generate-invite-link/:roomId', (req, res) => {
  const roomId = req.params.roomId || uuidv4();
  const inviteLink = `${req.protocol}://${req.get('host')}/${roomId}`;
  res.json({ roomId, inviteLink });
});

// ... (existing code)

io.on('connection', (socket) => {
  console.log('New connection');

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    socket.on('message', (message) => {
      console.log('Received message server.js:', message);
      io.to(roomId).emit('createMessage', message);
    });
    

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });

    // Listen for the 'start-stream' event and share the screen with the user
    socket.on('start-stream', () => {
      socket.to(roomId).broadcast.emit('start-stream');
    });

    // Send the list of connected users to the client
    io.to(roomId).emit('users-list', Array.from(socket.adapter.rooms.get(roomId)));
  });
});

// ... (existing code)


server.listen(process.env.PORT || 8080);
