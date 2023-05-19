import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

const app = express();
const httpServer = new HttpServer(app);
const io = new SocketIOServer(httpServer);

app.use(express.static('public'));

io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId: string) => {
    console.log('User joined room:', roomId);
    const roomClients = io.sockets.adapter.rooms.get(roomId) || new Set();
    roomClients.forEach((clientId: string) => {
      socket.emit('peer-connected', { clientId });
      io.to(clientId).emit('peer-connected', { clientId: socket.id });
    });
    socket.join(roomId);
  });

  socket.on('offer', (data: { receiverId: string; offer: RTCSessionDescriptionInit }) => {
    socket.to(data.receiverId).emit('offer', { senderId: socket.id, offer: data.offer });
  });

  socket.on('answer', (data: { receiverId: string; answer: RTCSessionDescriptionInit }) => {
    socket.to(data.receiverId).emit('answer', { senderId: socket.id, answer: data.answer });
  });

  socket.on('icecandidate', (data: { receiverId: string; candidate: RTCIceCandidateInit }) => {
    socket.to(data.receiverId).emit('icecandidate', { senderId: socket.id, candidate: data.candidate });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit('peer-disconnected', { clientId: socket.id });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});