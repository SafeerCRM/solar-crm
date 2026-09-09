import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class PushNotificationService
  implements OnModuleInit
{
  private readonly logger = new Logger(
    PushNotificationService.name,
  );

  onModuleInit() {
    if (getApps().length > 0) {
      return;
    }

    const projectId =
      process.env.FIREBASE_PROJECT_ID;
    const clientEmail =
      process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey =
      process.env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        '\n',
      );

    if (
      !projectId ||
      !clientEmail ||
      !privateKey
    ) {
      this.logger.warn(
        'Firebase Admin credentials are not configured. Push notifications are disabled.',
      );
      return;
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    this.logger.log(
      'Firebase Admin initialized successfully',
    );
  }

  async sendToToken(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  if (getApps().length === 0) {
    this.logger.warn(
      'Firebase Admin is not initialized. Push notification skipped.',
    );

    return null;
  }

  return getMessaging().send({
    token,
    notification: {
      title,
      body,
    },
    data,
    android: {
      priority: 'high',
    },
  });
}
}