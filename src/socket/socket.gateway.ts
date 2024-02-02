import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket as IOSocket } from 'socket.io';

interface Socket extends IOSocket {
  room?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}
  @WebSocketServer() server: Server;
  users = {};

  afterInit(server: Server) {
    console.log('WebSocket Server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const roomID = this.users[client.id];
    if (roomID) {
      client.to(roomID).emit('user left', client.id);
      client.leave(roomID);
      this.server.sockets.emit(
        'update users',
        Object.keys(this.users).filter((socketId) => socketId !== client.id),
      );
      delete this.users[client.id];
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join room')
  joinRoom(client: Socket, room: string): void {
    this.users[client.id] = room;
    client.join(room);
    this.server.to(room).emit(
      'update users',
      Object.keys(this.users).filter(
        (socketId) => this.users[socketId] === room,
      ),
    );
    console.log(`Client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, { offer, to }): void {
    this.server.to(to).emit('offer', { offer, from: client.id });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, { answer, to }): void {
    this.server.to(to).emit('answer', { answer, from: client.id });
  }

  @SubscribeMessage('candidate')
  handleCandidate(client: Socket, { candidate, to }): void {
    this.server.to(to).emit('candidate', { candidate, from: client.id });
  }
}
