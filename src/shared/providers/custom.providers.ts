import { Provider } from '@nestjs/common';
import {
  APP_CONFIG,
  AppConfig,
  NOTIFICATION_CLIENT,
  NotificationClient,
} from '../constants/tokens';

export const AppConfigProvider: Provider = {
  provide: APP_CONFIG,
  useValue: {
    storeName: 'Online Store — Clothes & Footwear',
    environment: process.env.NODE_ENV || 'development',
    currency: 'UAH',
    taxRate: 0.2,
  } satisfies AppConfig,
};

export const NotificationClientProvider: Provider = {
  provide: NOTIFICATION_CLIENT,
  useFactory: (config: AppConfig): NotificationClient => {
    return {
      sender: 'noreply@store.ua',
      isProduction: config.environment === 'production',
      sendOrderReceipt: (orderId: string, total: number, currency: string) => {
        return `[Email від noreply@store.ua] Чек за замовлення #${orderId} на суму ${total} ${currency} надіслано.`;
      },
    };
  },
  inject: [APP_CONFIG],
};