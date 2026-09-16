import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

import {
  IciciMerchantAccount,
  IciciPaymentPurpose,
  IciciPaymentTransaction,
  IciciPaymentTransactionStatus,
} from './icici-payment-transaction.entity';

type IciciMerchantConfig = {
  merchantId: string;
  aggregatorId: string;
  secretKey: string;
};

type InitiatePaymentInput = {
  merchantAccount: IciciMerchantAccount;
  purpose: IciciPaymentPurpose;
  referenceId: number;

  dealerId?: number;

  amount: number;

  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;

  returnUrl: string;
};

@Injectable()
export class IciciPaymentService {
  private readonly initiateSaleUrl =
    process.env.ICICI_PG_INITIATE_URL ||
    'https://pgpay.icicibank.com/pg/api/v2/initiateSale';

    private readonly commandUrl =
  process.env.ICICI_PG_COMMAND_URL ||
  'https://pgpay.icicibank.com/pg/api/command';

  constructor(
    @InjectRepository(
      IciciPaymentTransaction,
    )
    private readonly transactionRepository:
      Repository<IciciPaymentTransaction>,
  ) {}

  private getMerchantConfig(
    account: IciciMerchantAccount,
  ): IciciMerchantConfig {
    let merchantId = '';
    let aggregatorId = '';
    let secretKey = '';

    if (
      account ===
      IciciMerchantAccount.SOLARS
    ) {
      merchantId =
        process.env
          .ICICI_SOLARS_MERCHANT_ID ||
        '';

      aggregatorId =
        process.env
          .ICICI_SOLARS_AGGREGATOR_ID ||
        '';

      secretKey =
        process.env
          .ICICI_SOLARS_LIVE_KEY ||
        '';
    }

    if (
      account ===
      IciciMerchantAccount.TRADING
    ) {
      merchantId =
        process.env
          .ICICI_TRADING_MERCHANT_ID ||
        '';

      aggregatorId =
        process.env
          .ICICI_TRADING_AGGREGATOR_ID ||
        '';

      secretKey =
        process.env
          .ICICI_TRADING_LIVE_KEY ||
        '';
    }

    if (
      !merchantId ||
      !aggregatorId ||
      !secretKey
    ) {
      throw new InternalServerErrorException(
        `ICICI ${account} merchant configuration is incomplete`,
      );
    }

    return {
      merchantId,
      aggregatorId,
      secretKey,
    };
  }

  private getMerchantConfigByMerchantId(
  merchantId: string,
): {
  account: IciciMerchantAccount;
  config: IciciMerchantConfig;
} {
  const normalizedMerchantId =
    String(
      merchantId || '',
    ).trim();

  if (!normalizedMerchantId) {
    throw new BadRequestException(
      'ICICI merchant ID is missing',
    );
  }

  const accounts = [
    IciciMerchantAccount.SOLARS,
    IciciMerchantAccount.TRADING,
  ];

  for (const account of accounts) {
    let config:
      IciciMerchantConfig;

    try {
      config =
        this.getMerchantConfig(
          account,
        );
    } catch {
      /*
       * One merchant may not yet be
       * configured in this environment.
       */
      continue;
    }

    if (
      config.merchantId ===
      normalizedMerchantId
    ) {
      return {
        account,
        config,
      };
    }
  }

  throw new BadRequestException(
    'Unknown ICICI merchant',
  );
}

  /*
   * ICICI V1 secureHash:
   *
   * 1. Ignore secureHash itself.
   * 2. Ignore null / undefined / empty values.
   * 3. Sort parameter names ascending.
   * 4. Concatenate VALUES only.
   * 5. HMAC-SHA256 using merchant Live Key.
   * 6. Lowercase hexadecimal result.
   */
  private createSecureHash(
    values: Record<
      string,
      any
    >,
    secretKey: string,
  ): string {
    const hashInput =
      Object.keys(values)
        .filter(
          (key) =>
            key !==
              'secureHash' &&
            values[key] !==
              null &&
            values[key] !==
              undefined &&
            String(
              values[key],
            ).length > 0,
        )
        .sort()
        .map((key) =>
          String(
            values[key],
          ),
        )
        .join('');

    return createHmac(
      'sha256',
      secretKey,
    )
      .update(
        hashInput,
        'utf8',
      )
      .digest('hex')
      .toLowerCase();
  }

  private secureHashesMatch(
  receivedHash: string,
  expectedHash: string,
): boolean {
  const received =
    String(
      receivedHash || '',
    )
      .trim()
      .toLowerCase();

  const expected =
    String(
      expectedHash || '',
    )
      .trim()
      .toLowerCase();

  if (
    !received ||
    !expected
  ) {
    return false;
  }

  const receivedBuffer =
    Buffer.from(
      received,
      'utf8',
    );

  const expectedBuffer =
    Buffer.from(
      expected,
      'utf8',
    );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    receivedBuffer,
    expectedBuffer,
  );
}

  /*
   * ICICI merchantTxnNo must be:
   *
   * - unique
   * - alphanumeric
   * - maximum 20 characters
   */
  private generateMerchantTxnNo(): string {
    const now =
      new Date();

    const yy =
      String(
        now.getFullYear(),
      ).slice(-2);

    const MM =
      String(
        now.getMonth() + 1,
      ).padStart(2, '0');

    const dd =
      String(
        now.getDate(),
      ).padStart(2, '0');

    const HH =
      String(
        now.getHours(),
      ).padStart(2, '0');

    const mm =
      String(
        now.getMinutes(),
      ).padStart(2, '0');

    const ss =
      String(
        now.getSeconds(),
      ).padStart(2, '0');

    const random =
      randomBytes(2)
        .toString('hex')
        .toUpperCase();

    return (
      `IC${yy}${MM}${dd}` +
      `${HH}${mm}${ss}` +
      random
    ).slice(0, 20);
  }

  private formatIciciDate(
    date: Date,
  ): string {
    const YYYY =
      date.getFullYear();

    const MM =
      String(
        date.getMonth() + 1,
      ).padStart(2, '0');

    const DD =
      String(
        date.getDate(),
      ).padStart(2, '0');

    const HH =
      String(
        date.getHours(),
      ).padStart(2, '0');

    const mm =
      String(
        date.getMinutes(),
      ).padStart(2, '0');

    const ss =
      String(
        date.getSeconds(),
      ).padStart(2, '0');

    return (
      `${YYYY}${MM}${DD}` +
      `${HH}${mm}${ss}`
    );
  }

  async initiatePayment(
    input: InitiatePaymentInput,
  ) {
    const amount =
      Number(
        input.amount,
      );

    if (
      !Number.isFinite(
        amount,
      ) ||
      amount <= 0
    ) {
      throw new BadRequestException(
        'Payment amount must be greater than zero',
      );
    }

    if (
      !Number.isInteger(
        Number(
          input.referenceId,
        ),
      ) ||
      Number(
        input.referenceId,
      ) <= 0
    ) {
      throw new BadRequestException(
        'Invalid payment reference',
      );
    }

    if (
      !input.returnUrl ||
      !/^https:\/\//i.test(
        input.returnUrl,
      )
    ) {
      throw new BadRequestException(
        'A valid HTTPS payment return URL is required',
      );
    }

    const merchant =
      this.getMerchantConfig(
        input.merchantAccount,
      );

    const merchantTxnNo =
      this.generateMerchantTxnNo();

    const now =
      new Date();

    /*
     * Create our transaction BEFORE
     * contacting ICICI.
     *
     * Therefore even failed initiation
     * attempts remain auditable.
     */
    let transaction =
      this.transactionRepository.create({
        merchantAccount:
          input.merchantAccount,

        purpose:
          input.purpose,

        referenceId:
          Number(
            input.referenceId,
          ),

        dealerId:
          input.dealerId
            ? Number(
                input.dealerId,
              )
            : undefined,

        merchantTxnNo,

        amount,

        currencyCode:
          '356',

        status:
          IciciPaymentTransactionStatus.CREATED,

        merchantId:
          merchant.merchantId,

        aggregatorId:
          merchant.aggregatorId,
      });

    transaction =
      await this
        .transactionRepository
        .save(
          transaction,
        );

    /*
     * Standard hosted-payment mode.
     */
    const requestBody:
      Record<string, any> = {
        merchantId:
          merchant.merchantId,

        merchantTxnNo,

        amount:
          amount.toFixed(2),

        currencyCode:
          '356',

        payType:
          '0',

        customerEmailID:
          input.customerEmail ||
          undefined,

        transactionType:
          'SALE',

        returnURL:
          input.returnUrl,

        txnDate:
          this.formatIciciDate(
            now,
          ),

        aggregatorID:
          merchant.aggregatorId,

        customerName:
          input.customerName ||
          undefined,

        customerMobileNo:
          input.customerMobile ||
          undefined,
      };

    requestBody.secureHash =
      this.createSecureHash(
        requestBody,
        merchant.secretKey,
      );

    try {
      const response =
        await fetch(
          this.initiateSaleUrl,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body:
              JSON.stringify(
                requestBody,
              ),
          },
        );

      const responseText =
        await response.text();

      let gatewayResponse:
        any = {};

      try {
        gatewayResponse =
          responseText
            ? JSON.parse(
                responseText,
              )
            : {};
      } catch {
        gatewayResponse = {
          rawResponse:
            responseText,
        };
      }

      const responseCode =
        String(
          gatewayResponse
            ?.responseCode ||
          '',
        );

      const successfulInitiation =
        response.ok &&
        responseCode ===
          'R1000' &&
        Boolean(
          gatewayResponse
            ?.redirectURI,
        ) &&
        Boolean(
          gatewayResponse
            ?.tranCtx,
        );

      if (
        !successfulInitiation
      ) {
        transaction.status =
          IciciPaymentTransactionStatus.FAILED;

        transaction.responseCode =
          responseCode ||
          String(
            response.status,
          );

        transaction.responseDescription =
          String(
            gatewayResponse
              ?.responseDescription ||
            gatewayResponse
              ?.message ||
            'ICICI payment initiation failed',
          );

        transaction.failedAt =
          new Date();

        transaction.gatewayMetadata =
          {
            httpStatus:
              response.status,
          };

        await this
          .transactionRepository
          .save(
            transaction,
          );

        throw new BadGatewayException(
          transaction
            .responseDescription,
        );
      }

      transaction.status =
        IciciPaymentTransactionStatus.INITIATED;

      transaction.responseCode =
        responseCode;

      transaction.responseDescription =
        gatewayResponse
          ?.responseDescription ||
        undefined;

      transaction.redirectUri =
        String(
          gatewayResponse
            .redirectURI,
        );

      transaction.transactionContext =
        String(
          gatewayResponse
            .tranCtx,
        );

      transaction.initiatedAt =
        new Date();

      transaction.gatewayMetadata =
        {
          showOTPCapturePage:
            gatewayResponse
              ?.showOTPCapturePage ||
            undefined,
        };

      transaction =
        await this
          .transactionRepository
          .save(
            transaction,
          );

      /*
       * Do NOT return secureHash,
       * merchant secret, or complete
       * ICICI response to frontend.
       */
      return {
        success: true,

        transactionId:
          transaction.id,

        merchantTxnNo:
          transaction
            .merchantTxnNo,

        amount:
          Number(
            transaction.amount,
          ),

        status:
          transaction.status,

        paymentUrl:
          `${transaction.redirectUri}?tranCtx=${encodeURIComponent(
            transaction
              .transactionContext ||
              '',
          )}`,
      };
    } catch (error) {
      /*
       * BadGatewayException above means
       * we already persisted the gateway
       * rejection.
       */
      if (
        error instanceof
        BadGatewayException
      ) {
        throw error;
      }

      transaction.status =
        IciciPaymentTransactionStatus.FAILED;

      transaction.responseDescription =
        'Unable to communicate with ICICI payment gateway';

      transaction.failedAt =
        new Date();

      transaction.gatewayMetadata =
        {
          networkError:
            true,
        };

      await this
        .transactionRepository
        .save(
          transaction,
        );

      /*
       * Do not expose raw network/TLS
       * errors to portal users.
       */
      throw new BadGatewayException(
        'Unable to communicate with ICICI payment gateway',
      );
    }
  }

  private async reconcileTransactionStatus(
  transaction: IciciPaymentTransaction,
) {
  const merchant =
    this.getMerchantConfig(
      transaction.merchantAccount,
    );

  /*
   * ICICI Status specification requires
   * merchantTxnNo and originalTxnNo.
   *
   * For a SALE status enquiry both refer
   * to our original merchant transaction
   * reference.
   */
  const requestBody:
    Record<string, any> = {
      merchantId:
        merchant.merchantId,

      aggregatorID:
        merchant.aggregatorId,

      merchantTxnNo:
        transaction.merchantTxnNo,

      originalTxnNo:
        transaction.merchantTxnNo,

      transactionType:
        'STATUS',
    };

  requestBody.secureHash =
    this.createSecureHash(
      requestBody,
      merchant.secretKey,
    );

  const form =
    new URLSearchParams();

  for (
    const [
      key,
      value,
    ] of Object.entries(
      requestBody,
    )
  ) {
    if (
      value === null ||
      value === undefined ||
      String(value).length === 0
    ) {
      continue;
    }

    form.append(
      key,
      String(value),
    );
  }

  let response:
    Response;

  try {
    response =
      await fetch(
        this.commandUrl,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded',

            Accept:
              'application/json',
          },

          body:
            form.toString(),
        },
      );
  } catch {
    transaction.lastStatusCheckedAt =
      new Date();

    transaction.gatewayMetadata =
      {
        ...(
          transaction
            .gatewayMetadata ||
          {}
        ),

        statusCheckNetworkError:
          true,

        statusCheckAt:
          new Date()
            .toISOString(),
      };

    await this
      .transactionRepository
      .save(
        transaction,
      );

    throw new BadGatewayException(
      'Unable to verify payment status with ICICI',
    );
  }

  const responseText =
    await response.text();

  let statusResponse:
    Record<string, any> = {};

  try {
    statusResponse =
      responseText
        ? JSON.parse(
            responseText,
          )
        : {};
  } catch {
    statusResponse = {};
  }

  transaction.lastStatusCheckedAt =
    new Date();

  if (
    !response.ok ||
    !statusResponse ||
    typeof statusResponse !==
      'object'
  ) {
    transaction.gatewayMetadata =
      {
        ...(
          transaction
            .gatewayMetadata ||
          {}
        ),

        statusCheckHttpStatus:
          response.status,

        statusCheckAt:
          new Date()
            .toISOString(),
      };

    await this
      .transactionRepository
      .save(
        transaction,
      );

    throw new BadGatewayException(
      'ICICI payment status verification failed',
    );
  }

  /*
   * The Status response itself is signed.
   * Verify it before trusting txnStatus,
   * amount, txnID, etc.
   */
  const receivedSecureHash =
    String(
      statusResponse
        ?.secureHash ||
      '',
    ).trim();

  if (!receivedSecureHash) {
    throw new BadGatewayException(
      'ICICI status response signature is missing',
    );
  }

  const expectedSecureHash =
    this.createSecureHash(
      statusResponse,
      merchant.secretKey,
    );

  if (
    !this.secureHashesMatch(
      receivedSecureHash,
      expectedSecureHash,
    )
  ) {
    throw new BadGatewayException(
      'Invalid ICICI status response signature',
    );
  }

  /*
   * Cross-check merchant identity.
   */
  const responseMerchantId =
    String(
      statusResponse
        ?.merchantId ||
      '',
    ).trim();

  if (
    responseMerchantId &&
    responseMerchantId !==
      transaction.merchantId
  ) {
    throw new BadGatewayException(
      'ICICI status merchant mismatch',
    );
  }

  /*
   * Verify amount whenever ICICI returns it.
   */
  if (
    statusResponse?.amount !==
      undefined &&
    statusResponse?.amount !==
      null &&
    String(
      statusResponse.amount,
    ).length > 0
  ) {
    const gatewayAmount =
      Number(
        statusResponse.amount,
      );

    const expectedAmount =
      Number(
        transaction.amount,
      );

    if (
      !Number.isFinite(
        gatewayAmount,
      ) ||
      Math.abs(
        gatewayAmount -
          expectedAmount,
      ) > 0.009
    ) {
      throw new BadGatewayException(
        'ICICI payment amount mismatch',
      );
    }
  }

  const txnStatus =
    String(
      statusResponse
        ?.txnStatus ||
      '',
    )
      .trim()
      .toUpperCase();

  const txnResponseCode =
    String(
      statusResponse
        ?.txnResponseCode ||
      '',
    ).trim();

  /*
   * ICICI documentation/sample identifies
   * SUC as successful transaction status.
   *
   * Their materials show successful
   * transaction response codes as 000 /
   * 0000, so accept either representation.
   */
  const paymentSuccessful =
    txnStatus ===
      'SUC' &&
    (
      txnResponseCode ===
        '000' ||
      txnResponseCode ===
        '0000'
    );

  transaction.responseCode =
    txnResponseCode ||
    String(
      statusResponse
        ?.responseCode ||
      transaction.responseCode ||
      '',
    );

  transaction.responseDescription =
    String(
      statusResponse
        ?.txnRespDescription ||
      statusResponse
        ?.respDescription ||
      transaction
        .responseDescription ||
      '',
    );

  transaction.paymentMode =
    statusResponse
      ?.paymentMode
      ? String(
          statusResponse
            .paymentMode,
        )
      : transaction.paymentMode;

  transaction.bankTxnId =
    statusResponse
      ?.txnID
      ? String(
          statusResponse
            .txnID,
        )
      : transaction.bankTxnId;

  transaction.paymentId =
    statusResponse
      ?.paymentID
      ? String(
          statusResponse
            .paymentID,
        )
      : transaction.paymentId;

  transaction.gatewayMetadata =
    {
      ...(
        transaction
          .gatewayMetadata ||
        {}
      ),

      statusVerified:
        true,

      statusCheckAt:
        new Date()
          .toISOString(),

      txnStatus,

      txnResponseCode,
  };

  /*
   * Only this verified Status response
   * is allowed to mark our generic
   * transaction SUCCESS.
   */
  if (paymentSuccessful) {
    transaction.status =
      IciciPaymentTransactionStatus.SUCCESS;

    transaction.paidAt =
      new Date();

    transaction.failedAt =
      undefined;
  } else if (
    txnStatus ===
      'REJ' ||
    txnStatus ===
      'ERR'
  ) {
    transaction.status =
      IciciPaymentTransactionStatus.FAILED;

    transaction.failedAt =
      new Date();
  } else {
    /*
     * REQ or any non-final/unknown state
     * remains pending.
     */
    transaction.status =
      IciciPaymentTransactionStatus.PENDING;
  }

  return this
    .transactionRepository
    .save(
      transaction,
    );
}

  async handlePaymentReturn(
  body: Record<string, any>,
) {
  const merchantId =
    String(
      body?.merchantId ||
      '',
    ).trim();

  const merchantTxnNo =
    String(
      body?.merchantTxnNo ||
      '',
    ).trim();

  const receivedSecureHash =
    String(
      body?.secureHash ||
      '',
    ).trim();

  if (
    !merchantId ||
    !merchantTxnNo ||
    !receivedSecureHash
  ) {
    throw new BadRequestException(
      'Invalid ICICI payment response',
    );
  }

  /*
   * Select the secret only from the
   * merchant ID returned by ICICI.
   */
  const {
    account,
    config,
  } =
    this.getMerchantConfigByMerchantId(
      merchantId,
    );

  /*
   * createSecureHash already:
   *
   * - excludes secureHash
   * - ignores empty values
   * - sorts parameter names
   * - concatenates values
   * - applies HMAC-SHA256
   *
   * Therefore the complete POST body
   * can be passed directly.
   */
  const expectedSecureHash =
    this.createSecureHash(
      body,
      config.secretKey,
    );

  if (
    !this.secureHashesMatch(
      receivedSecureHash,
      expectedSecureHash,
    )
  ) {
    throw new BadRequestException(
      'Invalid ICICI payment signature',
    );
  }

  /*
   * The signature is valid, but that
   * still does NOT mean the payment
   * should be considered successful.
   */
  const transaction =
    await this
      .transactionRepository
      .findOne({
        where: {
          merchantTxnNo,
        },
      });

  if (!transaction) {
    throw new BadRequestException(
      'ICICI payment transaction not found',
    );
  }

  /*
   * Prevent a correctly signed response
   * for one merchant account being used
   * against a transaction belonging to
   * another account.
   */
  if (
    transaction.merchantId !==
      merchantId ||
    transaction.merchantAccount !==
      account
  ) {
    throw new BadRequestException(
      'ICICI merchant transaction mismatch',
    );
  }

  /*
   * Save only useful identifiers/status
   * from the callback.
   *
   * Do NOT mark SUCCESS here.
   */
  transaction.responseCode =
    body?.responseCode
      ? String(
          body.responseCode,
        )
      : transaction.responseCode;

  transaction.responseDescription =
    body?.respDescription
      ? String(
          body.respDescription,
        )
      : transaction
          .responseDescription;

  transaction.bankTxnId =
    body?.txnID
      ? String(
          body.txnID,
        )
      : transaction.bankTxnId;

  transaction.paymentId =
    body?.paymentID
      ? String(
          body.paymentID,
        )
      : transaction.paymentId;

  transaction.status =
    IciciPaymentTransactionStatus.PENDING;

  transaction.gatewayMetadata =
    {
      ...(
        transaction
          .gatewayMetadata ||
        {}
      ),

      callbackVerified:
        true,

      callbackReceivedAt:
        new Date()
          .toISOString(),
  };

  await this
  .transactionRepository
  .save(
    transaction,
  );

/*
 * A valid callback signature is not
 * sufficient to declare payment success.
 *
 * Independently ask ICICI for the
 * transaction's current status.
 */
const reconciledTransaction =
  await this
    .reconcileTransactionStatus(
      transaction,
    );

return {
  received: true,
  verified: true,

  transactionId:
    reconciledTransaction.id,

  merchantTxnNo:
    reconciledTransaction
      .merchantTxnNo,

  status:
    reconciledTransaction
      .status,

  paymentSuccessful:
    reconciledTransaction
      .status ===
    IciciPaymentTransactionStatus.SUCCESS,
};
}
}