import { Module } from '@nestjs/common';
import { ChatGateway } from './socket/socket.gateway';
import { MainModule } from './main/main.module';

@Module({
  imports: [MainModule],
  controllers: [],
  providers: [ChatGateway],
})
export class AppModule {}
