import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  IciciPaymentLaunch,
  IciciPaymentLaunchPurpose,
  IciciPaymentLaunchStatus,
} from './icici-payment-launch.entity';

import * as crypto from 'crypto';



interface IciciPaymentLaunchPayload {
  version: 1;

  purpose:
    IciciPaymentLaunchPurpose;

  referenceId: number;

  dealerId: number;

  paymentSource:
    'APP' | 'WEB';

  expiresAt: number;

  nonce: string;
}

@Injectable()
export class IciciPaymentLaunchService {

    constructor(
  @InjectRepository(
    IciciPaymentLaunch,
  )
  private readonly launchRepository:
    Repository<IciciPaymentLaunch>,
) {}


  private getSecret() {
    const secret =
      String(
        process.env
          .ICICI_PAYMENT_LAUNCH_SECRET ||
          '',
      ).trim();

    if (!secret) {
      throw new Error(
        'ICICI_PAYMENT_LAUNCH_SECRET is not configured',
      );
    }

    return secret;
  }

  private encodeBase64Url(
    value: string,
  ) {
    return Buffer.from(
      value,
      'utf8',
    ).toString('base64url');
  }

  private decodeBase64Url(
    value: string,
  ) {
    return Buffer.from(
      value,
      'base64url',
    ).toString('utf8');
  }

  private sign(
    encodedPayload: string,
  ) {
    return crypto
      .createHmac(
        'sha256',
        this.getSecret(),
      )
      .update(
        encodedPayload,
        'utf8',
      )
      .digest(
        'base64url',
      );
  }

  async createDealerLaunchToken(input: {
  purpose:
    IciciPaymentLaunchPurpose;

  referenceId: number;

  dealerId: number;

  paymentSource:
    'APP' | 'WEB';
}) {
  const referenceId =
    Number(
      input.referenceId,
    );

  const dealerId =
    Number(
      input.dealerId,
    );

  if (
    !Number.isInteger(
      referenceId,
    ) ||
    referenceId <= 0
  ) {
    throw new BadRequestException(
      'Invalid payment reference',
    );
  }

  if (
    !Number.isInteger(
      dealerId,
    ) ||
    dealerId <= 0
  ) {
    throw new BadRequestException(
      'Invalid dealer payment identity',
    );
  }

    if (
    input.purpose !==
      IciciPaymentLaunchPurpose
        .DEALER_ORDER &&
    input.purpose !==
      IciciPaymentLaunchPurpose
        .DEALER_INSURANCE
  ) {
    throw new BadRequestException(
      'Invalid payment launch purpose',
    );
  }

  if (
    input.paymentSource !==
      'APP' &&
    input.paymentSource !==
      'WEB'
  ) {
    throw new BadRequestException(
      'Invalid payment source',
    );
  }

  const expiresAt =
    Date.now() +
    5 * 60 * 1000;

  const nonce =
    crypto
      .randomBytes(16)
      .toString('hex');

  const payload:
    IciciPaymentLaunchPayload =
    {
      version: 1,

      purpose:
        input.purpose,

            referenceId,

      dealerId,

      paymentSource:
        input.paymentSource,

      expiresAt,

      nonce,
    };

  /*
   * Persist the authorization before
   * returning the signed token.
   *
   * Therefore a token successfully returned
   * to the browser always has a matching
   * server-side launch record.
   */
  const launch =
    this.launchRepository.create({
      purpose:
        input.purpose,

      referenceId,

      dealerId,

      nonce,

      status:
        IciciPaymentLaunchStatus
          .ISSUED,

      expiresAt:
        new Date(
          expiresAt,
        ),

      consumedAt:
        null,
    });

  await this.launchRepository.save(
    launch,
  );

  const encodedPayload =
    this.encodeBase64Url(
      JSON.stringify(
        payload,
      ),
    );

  const signature =
    this.sign(
      encodedPayload,
    );

  return `${encodedPayload}.${signature}`;
}

  verifyDealerLaunchToken(
    token: string,
  ) {
    const normalizedToken =
      String(
        token ||
        '',
      ).trim();

    const parts =
      normalizedToken.split(
        '.',
      );

    if (
      parts.length !== 2 ||
      !parts[0] ||
      !parts[1]
    ) {
      throw new BadRequestException(
        'Invalid payment launch token',
      );
    }

    const [
      encodedPayload,
      receivedSignature,
    ] = parts;

    const expectedSignature =
      this.sign(
        encodedPayload,
      );

    const receivedBuffer =
      Buffer.from(
        receivedSignature,
        'utf8',
      );

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        'utf8',
      );

    if (
      receivedBuffer.length !==
        expectedBuffer.length ||
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer,
      )
    ) {
      throw new BadRequestException(
        'Invalid payment launch token',
      );
    }

    let payload:
      IciciPaymentLaunchPayload;

    try {
      payload =
        JSON.parse(
          this.decodeBase64Url(
            encodedPayload,
          ),
        );
    } catch {
      throw new BadRequestException(
        'Invalid payment launch token',
      );
    }

    if (
      payload?.version !== 1 ||
      !Number.isInteger(
        Number(
          payload.referenceId,
        ),
      ) ||
      Number(
        payload.referenceId,
      ) <= 0 ||
      !Number.isInteger(
        Number(
          payload.dealerId,
        ),
      ) ||
      Number(
        payload.dealerId,
      ) <= 0 ||
      !Number.isFinite(
        Number(
          payload.expiresAt,
        ),
      ) ||
      !String(
        payload.nonce ||
        '',
      ).trim()
    ) {
      throw new BadRequestException(
        'Invalid payment launch token',
      );
    }

        if (
      payload.purpose !==
        IciciPaymentLaunchPurpose
          .DEALER_ORDER &&
      payload.purpose !==
        IciciPaymentLaunchPurpose
          .DEALER_INSURANCE
    ) {
      throw new BadRequestException(
        'Invalid payment launch purpose',
      );
    }

    if (
      payload.paymentSource !==
        'APP' &&
      payload.paymentSource !==
        'WEB'
    ) {
      throw new BadRequestException(
        'Invalid payment launch token',
      );
    }

    if (
      Date.now() >
      Number(
        payload.expiresAt,
      )
    ) {
      throw new BadRequestException(
        'Payment launch link has expired',
      );
    }

    return {
      purpose:
        payload.purpose,

      referenceId:
        Number(
          payload.referenceId,
        ),

            dealerId:
        Number(
          payload.dealerId,
        ),

      paymentSource:
        payload.paymentSource,

      expiresAt:
        Number(
          payload.expiresAt,
        ),

      nonce:
        String(
          payload.nonce,
        ),
    };
  }

  async consumeDealerLaunchToken(
  token: string,
) {
  /*
   * First verify the HMAC signature,
   * payload structure and token-level
   * expiry.
   */
  const payload =
    this.verifyDealerLaunchToken(
      token,
    );

  /*
   * Atomically consume the corresponding
   * persisted authorization.
   *
   * The WHERE clause itself requires
   * ISSUED status, so two simultaneous
   * requests cannot both consume the
   * same launch.
   */
  const result =
    await this.launchRepository
      .createQueryBuilder()
      .update(
        IciciPaymentLaunch,
      )
      .set({
        status:
          IciciPaymentLaunchStatus
            .CONSUMED,

        consumedAt:
          new Date(),
      })
      .where(
        '"nonce" = :nonce',
        {
          nonce:
            payload.nonce,
        },
      )
      .andWhere(
        '"purpose" = :purpose',
        {
          purpose:
            payload.purpose,
        },
      )
      .andWhere(
        '"referenceId" = :referenceId',
        {
          referenceId:
            payload.referenceId,
        },
      )
      .andWhere(
        '"dealerId" = :dealerId',
        {
          dealerId:
            payload.dealerId,
        },
      )
      .andWhere(
        '"status" = :status',
        {
          status:
            IciciPaymentLaunchStatus
              .ISSUED,
        },
      )
      .andWhere(
        '"expiresAt" >= :now',
        {
          now:
            new Date(),
        },
      )
      .execute();

  if (
    Number(
      result.affected || 0,
    ) !== 1
  ) {
    /*
     * Deliberately use one generic error
     * for missing, expired and previously
     * consumed launches.
     *
     * The public consumer does not need
     * information about which condition
     * failed.
     */
    throw new BadRequestException(
      'Payment launch link is invalid or no longer available',
    );
  }

    return {
    purpose:
      payload.purpose,

    referenceId:
      payload.referenceId,

    dealerId:
      payload.dealerId,

    paymentSource:
      payload.paymentSource,
  };
}
}