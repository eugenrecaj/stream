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
  socketToRoom = {};

  handleDisconnect(client: Socket) {
    const roomID = this.socketToRoom[client.id];
    let room = this.users[roomID];
    if (room) {
      room = room.filter((id) => id !== client.id);
      this.users[roomID] = room;
    }
  }

  @SubscribeMessage('join room')
  handleJoinRoom(data, socket) {
    console.log(data);

    const roomID = data.room;

    if (this.users[roomID]) {
      const length = this.users[roomID].length;
      if (length === 4) {
        socket.emit('room full');
        return;
      }
      this.users[roomID].push(socket.id);
    } else {
      this.users[roomID] = [socket.id];
    }
    this.socketToRoom[socket.id] = roomID;
    const usersInThisRoom = this.users[roomID].filter((id) => id !== socket.id);

    this.server.emit('all users', usersInThisRoom);
  }

  @SubscribeMessage('sending signal')
  handleSendingSignal(payload, client) {
    this.server.to(payload.userToSignal).emit('user joined', {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  }

  @SubscribeMessage('returning signal')
  handleReturningSignal(payload, client) {
    this.server.to(payload.callerID).emit('receiving returned signal', {
      signal: payload.signal,
      id: client.id,
    });
  }

  afterInit(server: Server) {
    console.log('Initialized!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    const room = client.handshake.auth.room;
    console.log(room.toString());

    if (room) {
      client.join(room.toString());
    }
  }
}
