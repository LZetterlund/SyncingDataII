const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3031;

// read the client html file into memory
// __dirnmae in node is the current directory
// (in this case the same folder as the server js file)
const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

// pass in the http server into socketio and grab the websocket server as io
const io = socketio(app);
const squarePosition = { x: 0, y: 0 };

// call to send a square out to all clients
const drawSend = () => {
  // const socket = sock;
  const randX = Math.floor(Math.random() * 300);
  const randY = Math.floor(Math.random() * 300);

  const time = new Date().getTime();
  const coords = {
    x: randX, y: randY, width: 100, height: 100,
  };
  squarePosition.x = randX;
  squarePosition.y = randY;

  // for some reason it breaks if I do not repackage the data into a new object
  const drawData = {
    time,
    coords,
  };
  io.sockets.in('room1').emit('draw', drawData);
};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', () => {
    console.log('User has entered your channel');
    socket.join('room1');
    drawSend();
  });
};

const onClick = (sock) => {
  const socket = sock;

  socket.on('click', (mouseClick) => {
    console.log(`Click recieved${mouseClick}`);
    // check if click is within square, if it is send a point and send a new square
    if (mouseClick.x >= squarePosition.x &&
           mouseClick.y >= squarePosition.y &&
           mouseClick.x < squarePosition.x + 100 &&
           mouseClick.y < squarePosition.y + 100) {
      socket.emit('point');
      console.log('Sent user a point');

      drawSend();
    }
  });
};

io.sockets.on('connection', (socket) => {
  onJoined(socket);
  onClick(socket);
});
