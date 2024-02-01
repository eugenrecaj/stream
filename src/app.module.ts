import { Module } from '@nestjs/common';
import { ChatGateway } from './socket/socket.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [ChatGateway],
})
export class AppModule {}
