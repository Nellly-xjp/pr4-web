export const APP_CONFIG = 'APP_CONFIG';
export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';

export interface AppConfig {
  storeName: string;
  environment: string;
  currency: string;
  taxRate: number;
}

export interface NotificationClient {
  sender: string;
  isProduction: boolean;
  sendOrderReceipt: (orderId: string, total: number, currency: string) => string;
}