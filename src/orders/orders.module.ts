import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ClothesModule } from '../clothes/clothes.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [ClothesModule, SharedModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}