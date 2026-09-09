'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerPushManager() {
  useEffect(() => {
    let registrationListener: any;

    const setupPush = async () => {
      try {
        if (!Capacitor.isNativePlatform()) {
          return;
        }

        const appInfo = await App.getInfo();

        if (
          appInfo.id !==
          'com.adityasolars.customer'
        ) {
          return;
        }

        const customerToken =
          localStorage.getItem(
            'customer_token',
          );

        if (!customerToken) {
          return;
        }

        let permissionStatus =
          await PushNotifications.checkPermissions();

        if (
          permissionStatus.receive ===
          'prompt'
        ) {
          permissionStatus =
            await PushNotifications.requestPermissions();
        }

        if (
          permissionStatus.receive !==
          'granted'
        ) {
          return;
        }

        registrationListener =
          await PushNotifications.addListener(
            'registration',
            async (token) => {
              try {
                const platform =
                  Capacitor.getPlatform() ===
                  'ios'
                    ? 'IOS'
                    : 'ANDROID';

                await fetch(
                  `${API_BASE_URL}/customer-auth/device-token`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type':
                        'application/json',
                      Authorization:
                        `Bearer ${customerToken}`,
                    },
                    body: JSON.stringify({
                      fcmToken:
                        token.value,
                      platform,
                      deviceId: null,
                    }),
                  },
                );
              } catch (error) {
                console.error(
                  'Customer push token registration failed',
                  error,
                );
              }
            },
          );

        await PushNotifications.register();
      } catch (error) {
        console.error(
          'Customer push setup failed',
          error,
        );
      }
    };

    setupPush();

    return () => {
      registrationListener?.remove();
    };
  }, []);

  return null;
}