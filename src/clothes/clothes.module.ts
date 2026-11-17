import { Module } from '@nestjs/common';
import { ClothesController } from './clothes.controller';
import { ClothesService } from './clothes.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ClothesController],
  providers: [ClothesService],
  exports: [ClothesService],
})
export class ClothesModule {}