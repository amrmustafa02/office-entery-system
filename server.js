const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer();
const io = socketIo(server, {
  cors: { origin: "*" }
});

let allRequests = [];
io.on('connection', (socket) => {
  socket.emit('update-leader1-requests', allRequests);
  socket.emit('update-leader2-requests', allRequests);

  socket.on('entry-leader1-request', (data) => {
    const newRequest = { id: Date.now(), ...data, status: 'waiting', time: Date.now(), leader: 'leader1' };
    allRequests.push(newRequest);
    io.emit('update-leader1-requests', allRequests);
  });

  socket.on('entry-leader2-request', (data) => {
    const newRequest = { id: Date.now(), ...data, status: 'waiting', time: Date.now(), leader: 'leader2' };
    allRequests.push(newRequest);
    io.emit('update-leader2-requests', allRequests);
  });

  socket.on('respond-leader1-request', ({ id, decision }) => {
    const req = allRequests.find(r => r.id === id);
    if (req) {
      req.status = decision;
      io.emit('update-leader1-requests', allRequests);
    }
  });

  socket.on('respond-leader2-request', ({ id, decision }) => {
    const req = allRequests.find(r => r.id === id);
    if (req) {
      req.status = decision;
      io.emit('update-leader2-requests', allRequests);
    }
  });

  socket.on('delete-leader1-request', (id) => {
    allRequests = allRequests.filter(req => req.id !== id);
    io.emit('update-leader1-requests', allRequests);
  });

  socket.on('delete-leader2-request', (id) => {
    allRequests = allRequests.filter(req => req.id !== id);
    io.emit('update-leader2-requests', allRequests);
  });
});

// Auto-cleanup after 2 minutes
setInterval(() => {
  const now = Date.now();

  [allRequests, allRequests].forEach((list, i) => {
    const originalLength = list.length;
    const updated = list.filter(req => req.status === 'waiting' || now - req.time < 120000);
    if (updated.length !== originalLength) {
      if (i === 0) {
        allRequests = updated;
        io.emit('update-leader1-requests', updated);
      } else {
        allRequests = updated;
        io.emit('update-leader2-requests', updated);
      }
    }
  });
}, 10000);

server.listen(3000, () => console.log("Server running on port 3000"));
