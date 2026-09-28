import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  private readonly phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  private readonly graphApiVersion =
    process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0';

  private validateConfig() {
    if (!this.accessToken) {
      throw new Error(
        'WHATSAPP_ACCESS_TOKEN is not configured',
      );
    }

    if (!this.phoneNumberId) {
      throw new Error(
        'WHATSAPP_PHONE_NUMBER_ID is not configured',
      );
    }
  }

  async sendTextMessage(
    to: string,
    message: string,
  ) {
    this.validateConfig();

    const response = await fetch(
      `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        'WhatsApp send failed:',
        data,
      );

      throw new Error(
        `WhatsApp API request failed with status ${response.status}`,
      );
    }

    return data;
  }
}