import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
// Simplified - direct agent access, no redundant services needed

@Module({
  controllers: [
    PlacesController,
  ],
  providers: [
    PlacesService,
  ],
  exports: [
    PlacesService,
  ],
})
export class PlacesModule {}
