const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer();
const io = socketIo(server, {
  cors: { origin: "*" }
});

let requests = [];

io.on('connection', (socket) => {
  socket.emit('update-requests', requests);

  socket.on('entry-request', (data) => {
    const newRequest = {
      id: Date.now(),
      name: data.name,
      reason: data.reason,
      status: 'waiting',
      time: Date.now()
    };
    requests.push(newRequest);
    io.emit('update-requests', requests);
  });

  socket.on('respond-request', ({ id, decision }) => {
    const req = requests.find(r => r.id === id);
    if (req) {
      req.status = decision;
      io.emit('update-requests', requests);
    }
  });
  socket.on('update-requests', (requests) => {
    if (requests.length > lastRequestCount) {
      const audio = document.getElementById("notifySound");
      if (audio) audio.play();
    }
    lastRequestCount = requests.length;
    render(requests);
  });

});

// 🧹 حذف الطلبات التي تمت الموافقة أو الرفض عليها بعد مرور دقيقتين
setInterval(() => {
  const now = Date.now();
  const before = requests.length;

  requests = requests.filter(req => {
    // إذا كان الطلب في الانتظار → لا تحذفه
    if (req.status === 'waiting') return true;

    // إذا تم الرد عليه → احذفه فقط بعد 1 دقيقة
    return now - req.time < 6000;
  });

  // إذا حصل تغيير، نرسل التحديث
  if (requests.length !== before) {
    io.emit('update-requests', requests);
  }
}, 10000);



server.listen(3000, () => console.log('Server running on port 3000'));
