import { Module } from '@nestjs/common';
import { SlugService } from './slug.service';
import {
  AppConfigProvider,
  NotificationClientProvider,
} from './providers/custom.providers';
import { APP_CONFIG, NOTIFICATION_CLIENT } from './constants/tokens';

@Module({
  providers: [SlugService, AppConfigProvider, NotificationClientProvider],
  exports: [SlugService, APP_CONFIG, NOTIFICATION_CLIENT],
})
export class SharedModule {}