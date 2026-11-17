import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ClothesService } from '../clothes/clothes.service';
import { APP_CONFIG, NOTIFICATION_CLIENT, type AppConfig, type NotificationClient } from '../shared/constants/tokens';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private orders: Order[] = [];

  constructor(
    private readonly clothesService: ClothesService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: NotificationClient,
  ) {}

  findAll(): Order[] {
    return this.orders;
  }

  findOne(id: string): Order {
    const order = this.orders.find((item) => item.id === id);
    if (!order) {
      throw new NotFoundException(`Замовлення з ID ${id} не знайдено`);
    }
    return order;
  }

  create(dto: CreateOrderDto): Order {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Кількість товару має бути більшою за 0');
    }

    const cloth = this.clothesService.findOne(dto.clothId);

    const subtotal = cloth.price * dto.quantity;
    const tax = Number((subtotal * this.config.taxRate).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const orderId = randomUUID();

    const receiptMessage = this.notificationClient.sendOrderReceipt(
      orderId,
      total,
      this.config.currency,
    );
    this.logger.log(receiptMessage);

    const newOrder: Order = {
      id: orderId,
      clothId: cloth.id,
      clothTitle: cloth.title,
      size: cloth.size,
      quantity: dto.quantity,
      unitPrice: cloth.price,
      subtotal,
      tax,
      total,
      currency: this.config.currency,
      receiptMessage,
      createdAt: new Date().toISOString(),
    };

    this.orders.push(newOrder);
    return newOrder;
  }
}