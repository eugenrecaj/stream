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

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload): Promise<void> {
    console.log(payload);

    client.broadcast.emit('message', payload);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log(data); // This should show the entire object received

    // The data object should have 'offer' and 'room' properties
    const offer = data.offer; // This should be the RTCSessionDescription
    const room = data.room; // This is the room ID

    // Now emit the offer to the specified room
    this.server.to(room.toString()).emit('offer', offer);
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log(data); // This should show the entire object received

    // The data object should have 'offer' and 'room' properties
    const answer = data.answer; // This should be the RTCSessionDescription
    const room = 11; // This is the room ID

    this.server.to(room.toString()).emit('answer', answer);
  }

  @SubscribeMessage('join-room')
  joinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    const roomId = data.room;
    const userId = data.id;

    console.log(userId, 'roomId');

    this.server.to(roomId).emit('user-connected', userId);

    this.server.on('disconnect', () => {
      this.server.to(roomId).emit('user-disconnected', userId);
    });
  }

  @SubscribeMessage('candidate')
  handleCandidate(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log(data); // This should show the entire object received

    // The data object should have 'offer' and 'room' properties
    const answer = data.answer; // This should be the RTCSessionDescription
    const room = 11; // This is the room ID

    this.server.to(room.toString()).emit('candidate', data);
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

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
