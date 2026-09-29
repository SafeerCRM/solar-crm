import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { JwtService } from '@nestjs/jwt';

import {
  Server,
  Socket,
} from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ProjectNotificationGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(
    client: Socket,
  ) {
    try {
      const token =
        this.extractToken(client);

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload =
        await this.jwtService.verifyAsync(
          token,
          {
            secret:
              process.env.JWT_SECRET,
          },
        );

      const userId = Number(
        payload?.sub ||
          payload?.id ||
          payload?.userId,
      );

      if (!userId) {
        client.disconnect(true);
        return;
      }

      client.data.userId =
        userId;

      await client.join(
        this.getUserRoom(userId),
      );

      console.log(
        `🔔 Notification socket connected: user ${userId} (${client.id})`,
      );
    } catch (error) {
      console.error(
        'Notification socket authentication failed:',
        error instanceof Error
          ? error.message
          : error,
      );

      client.disconnect(true);
    }
  }

  handleDisconnect(
    client: Socket,
  ) {
    const userId =
      Number(
        client.data?.userId || 0,
      );

    console.log(
      `🔕 Notification socket disconnected: ${
        userId
          ? `user ${userId}`
          : 'unauthenticated'
      } (${client.id})`,
    );
  }

  emitToUser(
    userId: number,
    notification: any,
  ) {
    const normalizedUserId =
      Number(userId);

    if (!normalizedUserId) {
      return;
    }

    this.server
      .to(
        this.getUserRoom(
          normalizedUserId,
        ),
      )
      .emit(
        'project:notification',
        notification,
      );
  }

  private extractToken(
    client: Socket,
  ): string | null {
    const authToken =
      client.handshake?.auth?.token;

    if (
      typeof authToken === 'string' &&
      authToken.trim()
    ) {
      return authToken
        .replace(/^Bearer\s+/i, '')
        .trim();
    }

    const authorization =
      client.handshake?.headers
        ?.authorization;

    if (
      typeof authorization ===
        'string' &&
      authorization.trim()
    ) {
      return authorization
        .replace(/^Bearer\s+/i, '')
        .trim();
    }

    return null;
  }

  private getUserRoom(
    userId: number,
  ) {
    return `user:${Number(userId)}`;
  }
}