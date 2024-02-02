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

  afterInit(server: Server) {
    console.log('WebSocket Server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, payload: string): void {
    console.log('Offer received and broadcasted');
    client.broadcast.emit('offer', payload);
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, payload: string): void {
    console.log('Answer received and broadcasted');
    client.broadcast.emit('answer', payload);
  }

  @SubscribeMessage('candidate')
  handleCandidate(client: Socket, payload: string): void {
    console.log('ICE Candidate received and broadcasted');
    client.broadcast.emit('candidate', payload);
  }
}
