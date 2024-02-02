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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const roomID = this.socketToRoom[client.id];
    let room = this.users[roomID];
    if (room) {
      room = room.filter((id) => id !== client.id);
      this.users[roomID] = room;
      if (room.length > 0) {
        // Notify remaining users that someone has disconnected
        this.server.to(roomID).emit('user disconnected', client.id);
      } else {
        // If no users left in the room, delete the room
        delete this.users[roomID];
      }
    }
    delete this.socketToRoom[client.id];
  }

  @SubscribeMessage('join room')
  handleJoinRoom(client: Socket, roomID: string) {
    if (this.users[roomID]) {
      const length = this.users[roomID].length;
      if (length === 4) {
        client.emit('room full');
        return;
      }
      this.users[roomID].push(client.id);
    } else {
      this.users[roomID] = [client.id];
    }
    this.socketToRoom[client.id] = roomID;
    const usersInThisRoom = this.users[roomID].filter((id) => id !== client.id);

    client.emit('all users', usersInThisRoom);
    client.join(roomID);
  }

  @SubscribeMessage('sending signal')
  handleSendingSignal(
    client: Socket,
    payload: { userToSignal: string; signal: any; callerID: string },
  ) {
    this.server.to(payload.userToSignal).emit('user joined', {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  }

  @SubscribeMessage('returning signal')
  handleReturningSignal(
    client: Socket,
    payload: { callerID: string; signal: any },
  ) {
    this.server.to(payload.callerID).emit('receiving returned signal', {
      signal: payload.signal,
      id: client.id,
    });
  }
  afterInit(server: Server) {
    console.log('Initialized!');
  }
}
