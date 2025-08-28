import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';
import { MastraIntegrationService } from './services/mastra-integration.service';
// import { SessionService } from './services/session.service';
import { ResponseFormatterService } from './services/response-formatter.service';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    MastraIntegrationService,
    // SessionService,
    ResponseFormatterService,
  ],
  exports: [
    ChatService,
    MastraIntegrationService,
    // SessionService,
  ],
})
export class ChatModule {}
