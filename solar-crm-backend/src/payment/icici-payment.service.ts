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

import {
  ProjectInsurancePaymentStatus,
  ProjectInsuranceRequest,
  ProjectInsuranceRequestSource,
} from '../project/project-insurance-request.entity';

import { ProjectDealerOrder } from '../project/project-dealer-order.entity';

import {
  ProjectDealerPayment,
  ProjectDealerPaymentStatus,
} from '../project/project-dealer-payment.entity';

import { ProjectDealerNotification } from '../project/project-dealer-notification.entity';
import { Dealer } from '../dealer/dealer.entity';
import { ProjectService } from '../project/project.service';

import {
  ProjectLedgerEntryType,
  ProjectLedgerSourceType,
} from '../project/project-party-ledger.entity';

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
customerId?: number;

amount: number;

  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;

  returnUrl: string;

  businessSettlementType?:
  | 'DEALER_INSURANCE'
  | 'DEALER_ORDER'
  | 'CUSTOMER_PAYMENT'
  | 'CUSTOMER_INSURANCE'
  | 'CUSTOMER_AFTER_SALES';

paymentSource?:
  | 'APP'
  | 'WEB';
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

  @InjectRepository(
    ProjectInsuranceRequest,
  )
  private readonly projectInsuranceRequestRepository:
    Repository<ProjectInsuranceRequest>,

    @InjectRepository(ProjectDealerOrder)
private readonly projectDealerOrderRepository:
  Repository<ProjectDealerOrder>,

@InjectRepository(ProjectDealerPayment)
private readonly projectDealerPaymentRepository:
  Repository<ProjectDealerPayment>,

@InjectRepository(ProjectDealerNotification)
private readonly projectDealerNotificationRepository:
  Repository<ProjectDealerNotification>,

  @InjectRepository(Dealer)
private readonly dealerRepository:
  Repository<Dealer>,

  private readonly projectService:
  ProjectService,
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

  private async updateActivePaymentSource(
  transaction: IciciPaymentTransaction,
  paymentSource?: 'APP' | 'WEB',
) {
  const source =
    String(
      paymentSource || 'WEB',
    )
      .trim()
      .toUpperCase();

  if (
    source !== 'APP' &&
    source !== 'WEB'
  ) {
    throw new BadRequestException(
      'Invalid payment source',
    );
  }

  if (
    transaction.status !==
      IciciPaymentTransactionStatus.CREATED &&
    transaction.status !==
      IciciPaymentTransactionStatus.INITIATED &&
    transaction.status !==
      IciciPaymentTransactionStatus.PENDING
  ) {
    return transaction;
  }

  const existingSource =
    transaction.gatewayMetadata
      ?.paymentSource;

  if (
    existingSource === source
  ) {
    return transaction;
  }

  transaction.gatewayMetadata = {
    ...(transaction.gatewayMetadata || {}),
    paymentSource: source,
  };

  return this.transactionRepository.save(
    transaction,
  );
}

  async initiateDealerInsurancePayment(
  input: InitiatePaymentInput,
) {
  if (
    input.purpose !==
      IciciPaymentPurpose.DEALER_INSURANCE ||
    input.merchantAccount !==
      IciciMerchantAccount.TRADING
  ) {
    throw new BadRequestException(
      'Invalid dealer insurance payment configuration',
    );
  }

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
    referenceId <= 0 ||
    !Number.isInteger(
      dealerId,
    ) ||
    dealerId <= 0
  ) {
    throw new BadRequestException(
      'Invalid dealer insurance payment reference',
    );
  }

  const previousTransaction =
    await this
      .transactionRepository
      .createQueryBuilder(
        'transaction',
      )
      .where(
        'transaction.purpose = :purpose',
        {
          purpose:
            IciciPaymentPurpose
              .DEALER_INSURANCE,
        },
      )
      .andWhere(
        'transaction.referenceId = :referenceId',
        {
          referenceId,
        },
      )
      .andWhere(
        'transaction.dealerId = :dealerId',
        {
          dealerId,
        },
      )
      .andWhere(
        'transaction.merchantAccount = :merchantAccount',
        {
          merchantAccount:
            IciciMerchantAccount
              .TRADING,
        },
      )
      .orderBy(
        'transaction.createdAt',
        'DESC',
      )
      .getOne();

      if (
  previousTransaction &&
  (
    previousTransaction.status ===
      IciciPaymentTransactionStatus.CREATED ||
    previousTransaction.status ===
      IciciPaymentTransactionStatus.INITIATED ||
    previousTransaction.status ===
      IciciPaymentTransactionStatus.PENDING
  )
) {
  await this.updateActivePaymentSource(
    previousTransaction,
    input.paymentSource,
  );
}

  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.SUCCESS
  ) {
    await this
      .dispatchSuccessfulTransaction(
        previousTransaction,
      );

    throw new BadRequestException(
      'Insurance payment has already been completed',
    );
  }

  /*
   * A callback-verified transaction may be
   * PENDING while awaiting/following Status
   * reconciliation.
   *
   * Reconcile it before ever creating another
   * charge attempt.
   */
  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.PENDING
  ) {
    const reconciled =
      await this
        .reconcileTransactionStatus(
          previousTransaction,
        );

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.SUCCESS
    ) {
      throw new BadRequestException(
        'Insurance payment has already been completed',
      );
    }

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.PENDING
    ) {
      throw new BadRequestException(
        'Previous insurance payment is still being processed. Please try again later.',
      );
    }

    /*
     * FAILED can continue below and create
     * a fresh payment attempt.
     */
  }

  /*
   * INITIATED means ICICI successfully created
   * the hosted-payment session but we have not
   * received a callback yet.
   *
   * For a recent attempt, return the same safe
   * hosted-payment URL instead of creating
   * another charge attempt.
   */
  if (
  previousTransaction?.status ===
    IciciPaymentTransactionStatus.INITIATED
) {
  const initiatedAt =
    previousTransaction.initiatedAt ||
    previousTransaction.createdAt;

  const ageMilliseconds =
    Date.now() -
    new Date(
      initiatedAt,
    ).getTime();

  const reuseWindowMilliseconds =
    15 * 60 * 1000;

  /*
   * A recent hosted-payment session can be
   * safely reused.
   */
  if (
    previousTransaction.redirectUri &&
    previousTransaction.transactionContext &&
    Number.isFinite(
      ageMilliseconds,
    ) &&
    ageMilliseconds >= 0 &&
    ageMilliseconds <=
      reuseWindowMilliseconds
  ) {
    return {
      success:
        true,

      transactionId:
        previousTransaction.id,

      merchantTxnNo:
        previousTransaction
          .merchantTxnNo,

      amount:
        Number(
          previousTransaction
            .amount,
        ),

      status:
        previousTransaction
          .status,

      paymentUrl:
        `${previousTransaction.redirectUri}?tranCtx=${encodeURIComponent(
          previousTransaction
            .transactionContext ||
            '',
        )}`,

      reused:
        true,
    };
  }

  /*
   * IMPORTANT:
   *
   * An old INITIATED transaction must never
   * be assumed failed merely because the
   * reuse window expired.
   *
   * The customer may already have paid while
   * the callback was delayed or lost.
   *
   * Ask ICICI for the authoritative status
   * before allowing another charge.
   */
  const reconciled =
    await this
      .reconcileTransactionStatus(
        previousTransaction,
      );

  if (
    reconciled.status ===
    IciciPaymentTransactionStatus.SUCCESS
  ) {
    throw new BadRequestException(
      'Insurance payment has already been completed',
    );
  }

  if (
    reconciled.status ===
      IciciPaymentTransactionStatus.PENDING ||
    reconciled.status ===
      IciciPaymentTransactionStatus.INITIATED
  ) {
    throw new BadRequestException(
      'Previous insurance payment is still being processed. Please try again later.',
    );
  }

  /*
   * Only a confirmed FAILED transaction may
   * fall through and create a new attempt.
   */
  if (
    reconciled.status !==
    IciciPaymentTransactionStatus.FAILED
  ) {
    throw new BadRequestException(
      'Previous insurance payment could not be confirmed as failed',
    );
  }
}

  /*
 * A confirmed FAILED transaction, or another
 * terminal non-success state, may continue
 * to a fresh ICICI attempt.
 *
 * INITIATED/PENDING transactions never reach
 * this point unless ICICI reconciliation has
 * confirmed that the previous attempt failed.
 */
  try {
  return await this.initiatePayment({
    ...input,

    businessSettlementType:
      'DEALER_INSURANCE',
  });
} catch (error: any) {
  /*
   * The database partial unique index allows
   * only one unresolved Dealer Insurance
   * payment attempt for:
   *
   * purpose + referenceId + dealerId
   * + merchantAccount
   *
   * Two simultaneous requests may both pass
   * the lookup above. One inserts first and
   * the other receives PostgreSQL 23505.
   */
  if (
    error?.code !==
    '23505'
  ) {
    throw error;
  }

  const concurrentTransaction =
    await this.transactionRepository
      .createQueryBuilder(
        'transaction',
      )
      .where(
        'transaction.purpose = :purpose',
        {
          purpose:
            IciciPaymentPurpose
              .DEALER_INSURANCE,
        },
      )
      .andWhere(
        'transaction.referenceId = :referenceId',
        {
          referenceId,
        },
      )
      .andWhere(
        'transaction.dealerId = :dealerId',
        {
          dealerId,
        },
      )
      .andWhere(
        'transaction.merchantAccount = :merchantAccount',
        {
          merchantAccount:
            IciciMerchantAccount
              .TRADING,
        },
      )
      .andWhere(
        'transaction.status IN (:...activeStatuses)',
        {
          activeStatuses: [
            IciciPaymentTransactionStatus.CREATED,
            IciciPaymentTransactionStatus.INITIATED,
            IciciPaymentTransactionStatus.PENDING,
          ],
        },
      )
      .orderBy(
        'transaction.createdAt',
        'DESC',
      )
      .getOne();

  if (
    !concurrentTransaction
  ) {
    /*
     * The 23505 came from something other
     * than our active-attempt constraint.
     */
    throw error;
  }

  await this.updateActivePaymentSource(
  concurrentTransaction,
  input.paymentSource,
);

  const businessSettlementType =
    String(
      concurrentTransaction
        .gatewayMetadata
        ?.businessSettlementType ||
        '',
    );

  if (
    businessSettlementType !==
    'DEALER_INSURANCE'
  ) {
    throw error;
  }

  /*
   * The winning request may already have
   * completed ICICI initiation.
   *
   * In that case return exactly the same
   * hosted-payment session.
   */
  if (
    concurrentTransaction.status ===
      IciciPaymentTransactionStatus.INITIATED &&
    concurrentTransaction.redirectUri &&
    concurrentTransaction.transactionContext
  ) {
    return {
      success:
        true,

      transactionId:
        concurrentTransaction.id,

      merchantTxnNo:
        concurrentTransaction
          .merchantTxnNo,

      amount:
        Number(
          concurrentTransaction.amount,
        ),

      status:
        concurrentTransaction.status,

      paymentUrl:
        `${concurrentTransaction.redirectUri}?tranCtx=${encodeURIComponent(
          concurrentTransaction
            .transactionContext ||
            '',
        )}`,

      reused:
        true,
    };
  }

  /*
   * CREATED means the other request has
   * created its durable transaction and may
   * currently be contacting ICICI.
   *
   * PENDING also represents an unresolved
   * payment.
   *
   * Never start another charge.
   */
  throw new BadRequestException(
    'Insurance payment initiation is already in progress. Please try again shortly.',
  );
}
}

async initiateCustomerInsurancePayment(
  input: InitiatePaymentInput,
) {
  /*
   * This wrapper is ONLY for Customer Portal
   * insurance payments through ADITYA SOLARS.
   */
  if (
    input.purpose !==
      IciciPaymentPurpose.CUSTOMER_INSURANCE ||
    input.merchantAccount !==
      IciciMerchantAccount.SOLARS
  ) {
    throw new BadRequestException(
      'Invalid customer insurance payment configuration',
    );
  }

  const referenceId =
    Number(
      input.referenceId,
    );

  const customerId =
    Number(
      input.customerId,
    );

  if (
    !Number.isInteger(
      referenceId,
    ) ||
    referenceId <= 0 ||
    !Number.isInteger(
      customerId,
    ) ||
    customerId <= 0
  ) {
    throw new BadRequestException(
      'Invalid customer insurance payment reference',
    );
  }

  const previousTransaction =
    await this
      .transactionRepository
      .createQueryBuilder(
        'transaction',
      )
      .where(
        'transaction.purpose = :purpose',
        {
          purpose:
            IciciPaymentPurpose
              .CUSTOMER_INSURANCE,
        },
      )
      .andWhere(
        'transaction.referenceId = :referenceId',
        {
          referenceId,
        },
      )
      .andWhere(
        'transaction.customerId = :customerId',
        {
          customerId,
        },
      )
      .andWhere(
        'transaction.merchantAccount = :merchantAccount',
        {
          merchantAccount:
            IciciMerchantAccount
              .SOLARS,
        },
      )
      .orderBy(
        'transaction.createdAt',
        'DESC',
      )
      .getOne();

  if (
    previousTransaction &&
    (
      previousTransaction.status ===
        IciciPaymentTransactionStatus.CREATED ||
      previousTransaction.status ===
        IciciPaymentTransactionStatus.INITIATED ||
      previousTransaction.status ===
        IciciPaymentTransactionStatus.PENDING
    )
  ) {
    await this.updateActivePaymentSource(
      previousTransaction,
      input.paymentSource,
    );
  }

  if (
    previousTransaction?.status ===
      IciciPaymentTransactionStatus.SUCCESS
  ) {
    await this
      .dispatchSuccessfulTransaction(
        previousTransaction,
      );

    throw new BadRequestException(
      'Insurance payment has already been completed',
    );
  }

  /*
   * Never create another payment while an
   * existing PENDING transaction may already
   * represent a successful bank payment.
   */
  if (
    previousTransaction?.status ===
      IciciPaymentTransactionStatus.PENDING
  ) {
    const reconciled =
      await this
        .reconcileTransactionStatus(
          previousTransaction,
        );

    if (
      reconciled.status ===
        IciciPaymentTransactionStatus.SUCCESS
    ) {
      throw new BadRequestException(
        'Insurance payment has already been completed',
      );
    }

    if (
      reconciled.status ===
        IciciPaymentTransactionStatus.PENDING
    ) {
      throw new BadRequestException(
        'Previous insurance payment is still being processed. Please try again later.',
      );
    }

    /*
     * FAILED can continue below and create
     * a fresh payment attempt.
     */
  }

  /*
   * A recent hosted-payment session should
   * be reused instead of creating another
   * ICICI transaction.
   */
  if (
    previousTransaction?.status ===
      IciciPaymentTransactionStatus.INITIATED
  ) {
    const initiatedAt =
      previousTransaction.initiatedAt ||
      previousTransaction.createdAt;

    const ageMilliseconds =
      Date.now() -
      new Date(
        initiatedAt,
      ).getTime();

    const reuseWindowMilliseconds =
      15 * 60 * 1000;

    if (
      previousTransaction.redirectUri &&
      previousTransaction.transactionContext &&
      Number.isFinite(
        ageMilliseconds,
      ) &&
      ageMilliseconds >= 0 &&
      ageMilliseconds <=
        reuseWindowMilliseconds
    ) {
      return {
        success: true,

        transactionId:
          previousTransaction.id,

        merchantTxnNo:
          previousTransaction
            .merchantTxnNo,

        amount:
          Number(
            previousTransaction.amount,
          ),

        status:
          previousTransaction.status,

        paymentUrl:
          `${previousTransaction.redirectUri}?tranCtx=${encodeURIComponent(
            previousTransaction
              .transactionContext ||
              '',
          )}`,

        reused: true,
      };
    }

    /*
     * An old INITIATED transaction cannot
     * simply be assumed failed. Reconcile
     * with ICICI before allowing a retry.
     */
    const reconciled =
      await this
        .reconcileTransactionStatus(
          previousTransaction,
        );

    if (
      reconciled.status ===
        IciciPaymentTransactionStatus.SUCCESS
    ) {
      throw new BadRequestException(
        'Insurance payment has already been completed',
      );
    }

    if (
      reconciled.status ===
        IciciPaymentTransactionStatus.PENDING ||
      reconciled.status ===
        IciciPaymentTransactionStatus.INITIATED
    ) {
      throw new BadRequestException(
        'Previous insurance payment is still being processed. Please try again later.',
      );
    }

    if (
      reconciled.status !==
        IciciPaymentTransactionStatus.FAILED
    ) {
      throw new BadRequestException(
        'Previous insurance payment could not be confirmed as failed',
      );
    }
  }

  /*
   * Only a confirmed failed/terminal previous
   * attempt may reach a fresh ICICI initiation.
   */
  try {
    return await this.initiatePayment({
      ...input,

      businessSettlementType:
        'CUSTOMER_INSURANCE',
    });
  } catch (error: any) {
    /*
     * The DB active-attempt index will prevent
     * two simultaneous Customer Insurance
     * transactions for the same request.
     *
     * If two requests race, retrieve and reuse
     * the transaction that won.
     */
    if (
      error?.code !==
        '23505'
    ) {
      throw error;
    }

    const concurrentTransaction =
      await this.transactionRepository
        .createQueryBuilder(
          'transaction',
        )
        .where(
          'transaction.purpose = :purpose',
          {
            purpose:
              IciciPaymentPurpose
                .CUSTOMER_INSURANCE,
          },
        )
        .andWhere(
          'transaction.referenceId = :referenceId',
          {
            referenceId,
          },
        )
        .andWhere(
          'transaction.customerId = :customerId',
          {
            customerId,
          },
        )
        .andWhere(
          'transaction.merchantAccount = :merchantAccount',
          {
            merchantAccount:
              IciciMerchantAccount
                .SOLARS,
          },
        )
        .andWhere(
          'transaction.status IN (:...activeStatuses)',
          {
            activeStatuses: [
              IciciPaymentTransactionStatus.CREATED,
              IciciPaymentTransactionStatus.INITIATED,
              IciciPaymentTransactionStatus.PENDING,
            ],
          },
        )
        .orderBy(
          'transaction.createdAt',
          'DESC',
        )
        .getOne();

    if (
      !concurrentTransaction
    ) {
      throw error;
    }

    await this.updateActivePaymentSource(
      concurrentTransaction,
      input.paymentSource,
    );

    const businessSettlementType =
      String(
        concurrentTransaction
          .gatewayMetadata
          ?.businessSettlementType ||
          '',
      );

    if (
      businessSettlementType !==
        'CUSTOMER_INSURANCE'
    ) {
      throw error;
    }

    /*
     * If the winning request already finished
     * ICICI initiation, return that same hosted
     * payment session.
     */
    if (
      concurrentTransaction.status ===
        IciciPaymentTransactionStatus.INITIATED &&
      concurrentTransaction.redirectUri &&
      concurrentTransaction.transactionContext
    ) {
      return {
        success: true,

        transactionId:
          concurrentTransaction.id,

        merchantTxnNo:
          concurrentTransaction
            .merchantTxnNo,

        amount:
          Number(
            concurrentTransaction.amount,
          ),

        status:
          concurrentTransaction.status,

        paymentUrl:
          `${concurrentTransaction.redirectUri}?tranCtx=${encodeURIComponent(
            concurrentTransaction
              .transactionContext ||
              '',
          )}`,

        reused: true,
      };
    }

    /*
     * CREATED means the concurrent request may
     * still be contacting ICICI. PENDING is also
     * unresolved. Never create another charge.
     */
    throw new BadRequestException(
      'Insurance payment initiation is already in progress. Please try again shortly.',
    );
  }
}

async initiateDealerOrderPayment(
  input: InitiatePaymentInput,
) {
  /*
   * This wrapper is ONLY for genuine
   * Dealer Order business payments.
   */
  if (
    input.purpose !==
      IciciPaymentPurpose.DEALER_ORDER ||
    input.merchantAccount !==
      IciciMerchantAccount.TRADING
  ) {
    throw new BadRequestException(
      'Invalid dealer order payment configuration',
    );
  }

  const orderId =
    Number(
      input.referenceId,
    );

  const portalDealerId =
    Number(
      input.dealerId,
    );

  if (
    !Number.isInteger(
      orderId,
    ) ||
    orderId <= 0 ||
    !Number.isInteger(
      portalDealerId,
    ) ||
    portalDealerId <= 0
  ) {
    throw new BadRequestException(
      'Invalid dealer order payment reference',
    );
  }

  /*
   * Look only at genuine Dealer Order
   * payment attempts.
   *
   * The businessSettlementType marker is
   * critical because old ₹1 test records
   * also used purpose DEALER_ORDER.
   */
  const previousTransactions =
    await this
      .transactionRepository
      .createQueryBuilder(
        'transaction',
      )
      .where(
        'transaction.purpose = :purpose',
        {
          purpose:
            IciciPaymentPurpose
              .DEALER_ORDER,
        },
      )
      .andWhere(
        'transaction.referenceId = :orderId',
        {
          orderId,
        },
      )
      .andWhere(
        'transaction.dealerId = :dealerId',
        {
          dealerId:
            portalDealerId,
        },
      )
      .andWhere(
        'transaction.merchantAccount = :merchantAccount',
        {
          merchantAccount:
            IciciMerchantAccount
              .TRADING,
        },
      )
      .orderBy(
        'transaction.createdAt',
        'DESC',
      )
      .getMany();

  const previousTransaction =
    previousTransactions.find(
      (item) =>
        String(
          item.gatewayMetadata
            ?.businessSettlementType ||
            '',
        ) ===
        'DEALER_ORDER',
    );

    if (
  previousTransaction &&
  (
    previousTransaction.status ===
      IciciPaymentTransactionStatus.CREATED ||
    previousTransaction.status ===
      IciciPaymentTransactionStatus.INITIATED ||
    previousTransaction.status ===
      IciciPaymentTransactionStatus.PENDING
  )
) {
  await this.updateActivePaymentSource(
    previousTransaction,
    input.paymentSource,
  );
}

  /*
   * If the latest genuine attempt is already
   * SUCCESS, run idempotent settlement again.
   *
   * Then do NOT create another payment session.
   *
   * DealerService will recalculate the order
   * before a future legitimate payment attempt,
   * so if money is still due later we can make
   * that policy explicit separately.
   */
  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.SUCCESS
  ) {
    await this
      .dispatchSuccessfulTransaction(
        previousTransaction,
      );

    throw new BadRequestException(
      'Previous dealer order payment has already been completed',
    );
  }

  /*
   * PENDING means we have an unresolved
   * gateway transaction.
   *
   * Always reconcile it with ICICI before
   * considering another charge.
   */
  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.PENDING
  ) {
    const reconciled =
      await this
        .reconcileTransactionStatus(
          previousTransaction,
        );

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.SUCCESS
    ) {
      throw new BadRequestException(
        'Previous dealer order payment has already been completed',
      );
    }

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.PENDING
    ) {
      throw new BadRequestException(
        'Previous dealer order payment is still being processed. Please try again later.',
      );
    }

    /*
     * FAILED can continue below.
     */
  }

  /*
   * INITIATED means ICICI created a hosted
   * payment session, but we do not yet have
   * a verified final result.
   *
   * Recent session:
   * return exactly the same hosted URL.
   */
  if (
    previousTransaction?.status ===
      IciciPaymentTransactionStatus.INITIATED
  ) {
    const initiatedAt =
      previousTransaction.initiatedAt ||
      previousTransaction.createdAt;

    const ageMilliseconds =
      Date.now() -
      new Date(
        initiatedAt,
      ).getTime();

    const reuseWindowMilliseconds =
      15 * 60 * 1000;

    if (
      previousTransaction.redirectUri &&
      previousTransaction.transactionContext &&
      Number.isFinite(
        ageMilliseconds,
      ) &&
      ageMilliseconds >= 0 &&
      ageMilliseconds <=
        reuseWindowMilliseconds
    ) {
      return {
        success:
          true,

        transactionId:
          previousTransaction.id,

        merchantTxnNo:
          previousTransaction
            .merchantTxnNo,

        amount:
          Number(
            previousTransaction
              .amount,
          ),

        status:
          previousTransaction
            .status,

        paymentUrl:
          `${previousTransaction.redirectUri}?tranCtx=${encodeURIComponent(
            previousTransaction
              .transactionContext ||
              '',
          )}`,

        reused:
          true,
      };
    }

    /*
     * IMPORTANT:
     *
     * An old INITIATED transaction is NOT
     * assumed abandoned merely because
     * 15 minutes elapsed.
     *
     * Ask ICICI for its actual status first.
     */
    const reconciled =
      await this
        .reconcileTransactionStatus(
          previousTransaction,
        );

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.SUCCESS
    ) {
      throw new BadRequestException(
        'Previous dealer order payment has already been completed',
      );
    }

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.PENDING ||
      reconciled.status ===
        IciciPaymentTransactionStatus.INITIATED
    ) {
      throw new BadRequestException(
        'Previous dealer order payment is still being processed. Please try again later.',
      );
    }

    /*
     * Only a final FAILED result may fall
     * through and create another attempt.
     */
    if (
      reconciled.status !==
      IciciPaymentTransactionStatus.FAILED
    ) {
      throw new BadRequestException(
        'Previous dealer order payment could not be confirmed as failed',
      );
    }
  }

  /*
   * A CREATED record means our database
   * transaction exists but initiation never
   * reached a trustworthy final state.
   *
   * Do not silently create another charge.
   */
  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.CREATED
  ) {
    throw new BadRequestException(
      'Previous dealer order payment initiation is incomplete. Please try again later.',
    );
  }

  /*
   * Current Dealer Order business policy:
   *
   * DealerService supplies the complete
   * server-calculated outstanding amount.
   *
   * The frontend does not control amount.
   */
  try {
  return await this.initiatePayment({
    ...input,

    businessSettlementType:
      'DEALER_ORDER',
  });
} catch (error: any) {
  /*
   * PostgreSQL partial unique index allows
   * only one unresolved Dealer Order payment
   * attempt for:
   *
   * purpose + referenceId + dealerId
   * + merchantAccount
   *
   * Two simultaneous requests can both pass
   * the lookup above. One creates the active
   * transaction; the other receives 23505.
   *
   * For that exact race, reload the active
   * transaction instead of exposing a DB error.
   */
  if (
    error?.code !==
    '23505'
  ) {
    throw error;
  }

  const concurrentTransaction =
    await this.transactionRepository
      .createQueryBuilder(
        'transaction',
      )
      .where(
        'transaction.purpose = :purpose',
        {
          purpose:
            IciciPaymentPurpose
              .DEALER_ORDER,
        },
      )
      .andWhere(
        'transaction.referenceId = :orderId',
        {
          orderId,
        },
      )
      .andWhere(
        'transaction.dealerId = :dealerId',
        {
          dealerId:
            portalDealerId,
        },
      )
      .andWhere(
        'transaction.merchantAccount = :merchantAccount',
        {
          merchantAccount:
            IciciMerchantAccount
              .TRADING,
        },
      )
      .andWhere(
        'transaction.status IN (:...activeStatuses)',
        {
          activeStatuses: [
            IciciPaymentTransactionStatus.CREATED,
            IciciPaymentTransactionStatus.INITIATED,
            IciciPaymentTransactionStatus.PENDING,
          ],
        },
      )
      .orderBy(
        'transaction.createdAt',
        'DESC',
      )
      .getOne();

  if (
    !concurrentTransaction
  ) {
    /*
     * Do not hide an unrelated unique
     * constraint violation.
     */
    throw error;
  }

  await this.updateActivePaymentSource(
  concurrentTransaction,
  input.paymentSource,
);

  const businessSettlementType =
    String(
      concurrentTransaction
        .gatewayMetadata
        ?.businessSettlementType ||
        '',
    );

  if (
    businessSettlementType !==
    'DEALER_ORDER'
  ) {
    throw error;
  }

  /*
   * If the winning request has already
   * completed ICICI initiation, safely
   * return exactly the same hosted session.
   */
  if (
    concurrentTransaction.status ===
      IciciPaymentTransactionStatus.INITIATED &&
    concurrentTransaction.redirectUri &&
    concurrentTransaction.transactionContext
  ) {
    return {
      success:
        true,

      transactionId:
        concurrentTransaction.id,

      merchantTxnNo:
        concurrentTransaction
          .merchantTxnNo,

      amount:
        Number(
          concurrentTransaction.amount,
        ),

      status:
        concurrentTransaction.status,

      paymentUrl:
        `${concurrentTransaction.redirectUri}?tranCtx=${encodeURIComponent(
          concurrentTransaction
            .transactionContext ||
            '',
        )}`,

      reused:
        true,
    };
  }

  /*
   * CREATED means the winning request has
   * inserted its durable transaction but
   * may still be contacting ICICI.
   *
   * PENDING similarly means there is already
   * an unresolved payment.
   *
   * Never start another charge here.
   */
  throw new BadRequestException(
    'Dealer order payment initiation is already in progress. Please try again shortly.',
  );
}
}

async initiateCustomerPayment(
  input: InitiatePaymentInput,
) {
  /*
   * This wrapper is only for genuine
   * Customer Portal installment payments.
   */
  if (
    input.purpose !==
      IciciPaymentPurpose.CUSTOMER_PAYMENT ||
    input.merchantAccount !==
      IciciMerchantAccount.SOLARS
  ) {
    throw new BadRequestException(
      'Invalid customer payment configuration',
    );
  }

  const installmentId =
    Number(
      input.referenceId,
    );

  const customerId =
    Number(
      input.customerId,
    );

  if (
    !Number.isInteger(
      installmentId,
    ) ||
    installmentId <= 0 ||
    !Number.isInteger(
      customerId,
    ) ||
    customerId <= 0
  ) {
    throw new BadRequestException(
      'Invalid customer payment reference',
    );
  }

  /*
   * Find the latest genuine payment attempt
   * for this exact customer + installment.
   */
  const previousTransactions =
    await this.transactionRepository
      .createQueryBuilder(
        'transaction',
      )
      .where(
        'transaction.purpose = :purpose',
        {
          purpose:
            IciciPaymentPurpose
              .CUSTOMER_PAYMENT,
        },
      )
      .andWhere(
        'transaction.referenceId = :installmentId',
        {
          installmentId,
        },
      )
      .andWhere(
        'transaction.customerId = :customerId',
        {
          customerId,
        },
      )
      .andWhere(
        'transaction.merchantAccount = :merchantAccount',
        {
          merchantAccount:
            IciciMerchantAccount
              .SOLARS,
        },
      )
      .orderBy(
        'transaction.createdAt',
        'DESC',
      )
      .getMany();

  /*
   * Keep the business-settlement marker
   * check just like Dealer Order.
   *
   * This prevents unrelated or historical
   * CUSTOMER_PAYMENT records from being
   * treated as genuine installment attempts.
   */
  const previousTransaction =
    previousTransactions.find(
      (item) =>
        String(
          item.gatewayMetadata
            ?.businessSettlementType ||
            '',
        ) ===
        'CUSTOMER_PAYMENT',
    );

  if (
    previousTransaction &&
    (
      previousTransaction.status ===
        IciciPaymentTransactionStatus.CREATED ||
      previousTransaction.status ===
        IciciPaymentTransactionStatus.INITIATED ||
      previousTransaction.status ===
        IciciPaymentTransactionStatus.PENDING
    )
  ) {
    await this.updateActivePaymentSource(
      previousTransaction,
      input.paymentSource,
    );
  }

  /*
   * SUCCESS must never create another
   * gateway attempt for the same installment
   * before its idempotent settlement has
   * been checked again.
   */
  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.SUCCESS
  ) {
    await this.dispatchSuccessfulTransaction(
      previousTransaction,
    );

    throw new BadRequestException(
      'This installment payment has already been completed',
    );
  }

  /*
   * An unresolved PENDING payment must be
   * reconciled with ICICI before another
   * payment attempt is allowed.
   */
  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.PENDING
  ) {
    const reconciled =
      await this.reconcileTransactionStatus(
        previousTransaction,
      );

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.SUCCESS
    ) {
      throw new BadRequestException(
        'This installment payment has already been completed',
      );
    }

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.PENDING
    ) {
      throw new BadRequestException(
        'Previous customer payment is still being processed. Please try again later.',
      );
    }
  }

  /*
   * Reuse a recent hosted ICICI session.
   */
  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.INITIATED
  ) {
    const initiatedAt =
      previousTransaction.initiatedAt ||
      previousTransaction.createdAt;

    const ageMilliseconds =
      Date.now() -
      new Date(
        initiatedAt,
      ).getTime();

    const reuseWindowMilliseconds =
      15 * 60 * 1000;

    if (
      previousTransaction.redirectUri &&
      previousTransaction.transactionContext &&
      Number.isFinite(
        ageMilliseconds,
      ) &&
      ageMilliseconds >= 0 &&
      ageMilliseconds <=
        reuseWindowMilliseconds
    ) {
      return {
        success:
          true,

        transactionId:
          previousTransaction.id,

        merchantTxnNo:
          previousTransaction
            .merchantTxnNo,

        amount:
          Number(
            previousTransaction.amount,
          ),

        status:
          previousTransaction.status,

        paymentUrl:
          `${previousTransaction.redirectUri}?tranCtx=${encodeURIComponent(
            previousTransaction
              .transactionContext ||
              '',
          )}`,

        reused:
          true,
      };
    }

    /*
     * An old hosted session is not assumed
     * failed. ICICI remains authoritative.
     */
    const reconciled =
      await this.reconcileTransactionStatus(
        previousTransaction,
      );

    if (
      reconciled.status ===
      IciciPaymentTransactionStatus.SUCCESS
    ) {
      throw new BadRequestException(
        'This installment payment has already been completed',
      );
    }

    if (
      reconciled.status ===
        IciciPaymentTransactionStatus.PENDING ||
      reconciled.status ===
        IciciPaymentTransactionStatus.INITIATED
    ) {
      throw new BadRequestException(
        'Previous customer payment is still being processed. Please try again later.',
      );
    }

    if (
      reconciled.status !==
      IciciPaymentTransactionStatus.FAILED
    ) {
      throw new BadRequestException(
        'Previous customer payment could not be confirmed as failed',
      );
    }
  }

  /*
   * A CREATED record may represent another
   * request that is currently contacting
   * ICICI. Do not create another attempt.
   */
  if (
    previousTransaction?.status ===
    IciciPaymentTransactionStatus.CREATED
  ) {
    throw new BadRequestException(
      'Previous customer payment initiation is incomplete. Please try again later.',
    );
  }

  try {
    return await this.initiatePayment({
      ...input,

      businessSettlementType:
        'CUSTOMER_PAYMENT',
    });
  } catch (error: any) {
    /*
     * Once the customer active-attempt
     * partial unique index is installed,
     * simultaneous requests can race here.
     */
    if (
      error?.code !==
      '23505'
    ) {
      throw error;
    }

    const concurrentTransaction =
      await this.transactionRepository
        .createQueryBuilder(
          'transaction',
        )
        .where(
          'transaction.purpose = :purpose',
          {
            purpose:
              IciciPaymentPurpose
                .CUSTOMER_PAYMENT,
          },
        )
        .andWhere(
          'transaction.referenceId = :installmentId',
          {
            installmentId,
          },
        )
        .andWhere(
          'transaction.customerId = :customerId',
          {
            customerId,
          },
        )
        .andWhere(
          'transaction.merchantAccount = :merchantAccount',
          {
            merchantAccount:
              IciciMerchantAccount
                .SOLARS,
          },
        )
        .andWhere(
          'transaction.status IN (:...activeStatuses)',
          {
            activeStatuses: [
              IciciPaymentTransactionStatus.CREATED,
              IciciPaymentTransactionStatus.INITIATED,
              IciciPaymentTransactionStatus.PENDING,
            ],
          },
        )
        .orderBy(
          'transaction.createdAt',
          'DESC',
        )
        .getOne();

    if (
      !concurrentTransaction
    ) {
      /*
       * Do not swallow some unrelated
       * unique-constraint violation.
       */
      throw error;
    }

    await this.updateActivePaymentSource(
      concurrentTransaction,
      input.paymentSource,
    );

    const businessSettlementType =
      String(
        concurrentTransaction
          .gatewayMetadata
          ?.businessSettlementType ||
          '',
      );

    if (
      businessSettlementType !==
      'CUSTOMER_PAYMENT'
    ) {
      throw error;
    }

    if (
      concurrentTransaction.status ===
        IciciPaymentTransactionStatus.INITIATED &&
      concurrentTransaction.redirectUri &&
      concurrentTransaction.transactionContext
    ) {
      return {
        success:
          true,

        transactionId:
          concurrentTransaction.id,

        merchantTxnNo:
          concurrentTransaction
            .merchantTxnNo,

        amount:
          Number(
            concurrentTransaction.amount,
          ),

        status:
          concurrentTransaction.status,

        paymentUrl:
          `${concurrentTransaction.redirectUri}?tranCtx=${encodeURIComponent(
            concurrentTransaction
              .transactionContext ||
              '',
          )}`,

        reused:
          true,
      };
    }

    throw new BadRequestException(
      'Customer payment initiation is already in progress. Please try again shortly.',
    );
  }
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

const paymentSource =
  String(
    input.paymentSource ||
      'WEB',
  )
    .trim()
    .toUpperCase();

if (
  paymentSource !== 'APP' &&
  paymentSource !== 'WEB'
) {
  throw new BadRequestException(
    'Invalid payment source',
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

customerId:
  input.customerId
    ? Number(
        input.customerId,
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

gatewayMetadata: {
  businessSettlementType:
    input.businessSettlementType ||
    null,

  paymentSource,
},
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

        transaction.gatewayMetadata = {
  ...(transaction.gatewayMetadata || {}),

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

      transaction.gatewayMetadata = {
  ...(transaction.gatewayMetadata || {}),

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

      transaction.gatewayMetadata = {
  ...(transaction.gatewayMetadata || {}),

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

  

private async getDealerPaymentIdentity(
  portalDealerId: number,
) {
  const dealer =
    await this.dealerRepository.findOne({
      where: {
        id: portalDealerId,
        isHidden: false,
      },
    });

  if (!dealer) {
    throw new BadRequestException(
      'Dealer Portal account not found for payment transaction',
    );
  }

  const resolvedPortalDealerId =
    Number(dealer.id || 0);

  const projectVendorId =
    Number(
      dealer.projectVendorId ||
        0,
    );

  /*
   * Keep exactly the same identity rule
   * used by DealerService:
   *
   * linked dealer:
   *   ONLY ProjectVendor.id is valid
   *
   * legacy unmapped dealer:
   *   Dealer.id remains valid
   *
   * Never accept both namespaces together,
   * because their numeric IDs can collide.
   */
  const businessDealerId =
    projectVendorId > 0
      ? projectVendorId
      : resolvedPortalDealerId;

  if (!businessDealerId) {
    throw new BadRequestException(
      'Dealer business identity could not be resolved',
    );
  }

  return {
    dealer,
    portalDealerId:
      resolvedPortalDealerId,
    projectVendorId:
      projectVendorId ||
      null,
    businessDealerId,
  };
}

private async recalculateDealerOrderPaymentFromApprovedPayments(
  orderId: number,
) {
  const order =
    await this.projectDealerOrderRepository.findOne({
      where: {
        id: orderId,
        isHidden: false,
      },
    });

  if (!order) {
    return null;
  }

  const approvedPayments =
    await this.projectDealerPaymentRepository.find({
      where: {
        dealerOrderId:
          order.id,

        status:
          ProjectDealerPaymentStatus.APPROVED,
      },
    });

  const paidAmount =
    approvedPayments.reduce(
      (sum, item) =>
        sum +
        Number(item.amount || 0),
      0,
    );

  order.paidAmount =
    paidAmount;

  order.pendingAmount =
    Math.max(
      Number(
        order.totalAmount || 0,
      ) - paidAmount,
      0,
    );

  return this.projectDealerOrderRepository.save(
    order,
  );
}

private async postDealerOrderGatewayLedger(
  payment: ProjectDealerPayment,
  order: ProjectDealerOrder,
) {
  if (
    payment.status !==
    ProjectDealerPaymentStatus.APPROVED
  ) {
    return null;
  }

  return this.projectService.postFinanceLedgerEntry({
    partyId:
      Number(payment.dealerId || 0) ||
      null,

    partyName:
      payment.dealerName ||
      order.dealerName ||
      `Dealer #${payment.dealerId}`,

    partyType:
      'DEALER',

    projectId:
      null,

    entryType:
      ProjectLedgerEntryType.CREDIT,

    sourceType:
  ProjectLedgerSourceType.DEALER_PAYMENT,

    sourceId:
      payment.id,

    amount:
      Number(payment.amount || 0),

    remarks:
      `Dealer payment approved - Order ${
        order.orderNumber ||
        order.id
      }`,

    user: {
      id: null,
      name:
        'ICICI PAYMENT GATEWAY',
    },
  });
}

private async settleDealerOrderTransaction(
  transaction: IciciPaymentTransaction,
) {
  if (
    transaction.status !==
    IciciPaymentTransactionStatus.SUCCESS
  ) {
    return;
  }

  const businessSettlementType =
  String(
    transaction.gatewayMetadata
      ?.businessSettlementType ||
      '',
  );

if (
  businessSettlementType !==
  'DEALER_ORDER'
) {
  return;
}

  if (
    transaction.merchantAccount !==
    IciciMerchantAccount.TRADING
  ) {
    throw new BadRequestException(
      'Dealer Order payment must use ADITYA TRADING merchant account',
    );
  }

  const orderId = Number(
    transaction.referenceId || 0,
  );

  const portalDealerId = Number(
  transaction.dealerId || 0,
);

if (!orderId || !portalDealerId) {
  throw new BadRequestException(
    'Invalid Dealer Order payment transaction reference',
  );
}

const identity =
  await this.getDealerPaymentIdentity(
    portalDealerId,
  );

  /*
 * Real Dealer Order ICICI payments are
 * initiated only for portal dealers linked
 * to the canonical Trading dealer master.
 *
 * Do not fall back to Dealer.id during
 * settlement. That fallback exists only for
 * legacy identity compatibility and the two
 * numeric ID namespaces can collide.
 */
if (
  !identity.projectVendorId
) {
  throw new BadRequestException(
    'Dealer Portal account is not linked to Trading dealer master',
  );
}

/*
 * For a genuine Dealer Order gateway
 * settlement the business identity must be
 * exactly ProjectVendor.id.
 */
if (
  Number(
    identity.businessDealerId,
  ) !==
  Number(
    identity.projectVendorId,
  )
) {
  throw new BadRequestException(
    'Dealer Order payment business identity mismatch',
  );
}

const order =
  await this.projectDealerOrderRepository.findOne({
    where: {
      id: orderId,
      dealerId:
        identity.businessDealerId,
      isHidden: false,
    },
  });

  if (!order) {
    throw new BadRequestException(
      'Dealer order not found for successful payment',
    );
  }

  /*
   * transaction.dealerId is the authenticated
   * Dealer Portal account ID.
   *
   * order.dealerId is the business dealer identity
   * used by Dealer Order / ProjectVendor records.
   *
   * Do NOT overwrite one with the other.
   */

  const existingPayment =
  await this.projectDealerPaymentRepository.findOne({
    where: {
      gatewayMerchantTxnNo:
        transaction.merchantTxnNo,
    },
  });

  if (existingPayment) {

    if (
  Number(existingPayment.dealerOrderId) !==
  Number(order.id)
) {
  throw new BadRequestException(
    'ICICI transaction is already linked to another Dealer Order',
  );
}

if (
  Number(existingPayment.dealerId) !==
  Number(identity.businessDealerId)
) {
  throw new BadRequestException(
    'ICICI transaction is already linked to another dealer',
  );
}

if (
  Math.abs(
    Number(existingPayment.amount || 0) -
      Number(transaction.amount || 0),
  ) > 0.009
) {
  throw new BadRequestException(
    'ICICI transaction amount does not match existing Dealer Order payment',
  );
}
    /*
     * Idempotency:
     * the same verified ICICI transaction must never
     * create a second ProjectDealerPayment.
     */
    if (
      existingPayment.status !==
      ProjectDealerPaymentStatus.APPROVED
    ) {
      existingPayment.status =
        ProjectDealerPaymentStatus.APPROVED;

      existingPayment.approvedAt =
        transaction.paidAt ||
        new Date();

      existingPayment.approvalNote =
        'Automatically approved after verified ICICI payment success';

      await this.projectDealerPaymentRepository.save(
        existingPayment,
      );
    }

    await this.recalculateDealerOrderPaymentFromApprovedPayments(
  order.id,
);

await this.postDealerOrderGatewayLedger(
  existingPayment,
  order,
);

return existingPayment;
  }

  const amount = Number(
    transaction.amount || 0,
  );

  if (amount <= 0) {
    throw new BadRequestException(
      'Invalid Dealer Order payment amount',
    );
  }

  /*
   * Never allow a verified transaction belonging
   * to another order amount context to overpay the
   * current outstanding balance.
   *
   * A tiny tolerance is allowed only for decimal
   * conversion differences.
   */
  const currentPendingAmount = Math.max(
    Number(order.totalAmount || 0) -
      Number(order.paidAmount || 0),
    0,
  );

  if (
    amount >
    currentPendingAmount + 0.009
  ) {
    throw new BadRequestException(
      'ICICI payment amount exceeds Dealer Order pending amount',
    );
  }

  const payment =
    this.projectDealerPaymentRepository.create({
      dealerOrderId:
        order.id,

      /*
       * Business ledger identity.
       * For current canonical orders this is
       * ProjectVendor.id.
       */
      dealerId:
  identity.businessDealerId,

      dealerName:
        order.dealerName ||
        '',

      amount,

      paymentMode:
        transaction.paymentMode ||
        'ONLINE',

      /*
       * merchantTxnNo is our unique gateway-side
       * transaction reference and is used for
       * settlement idempotency.
       */
      transactionId:
  transaction.bankTxnId ||
  transaction.merchantTxnNo,

gatewayMerchantTxnNo:
  transaction.merchantTxnNo,

receiptUrl:
  '',

      status:
        ProjectDealerPaymentStatus.APPROVED,


      approvedByName:
        'ICICI PAYMENT GATEWAY',

      approvedAt:
        transaction.paidAt ||
        new Date(),

      approvalNote:
        'Automatically approved after verified ICICI payment success',

      createdBy:
  identity.portalDealerId,

createdByName:
  identity.dealer.dealerName ||
  order.dealerName ||
  'Dealer Portal',

      remarks:
        `ICICI online payment - ${transaction.merchantTxnNo}`,
    });

  let savedPayment:
  ProjectDealerPayment;

try {
  savedPayment =
    await this
      .projectDealerPaymentRepository
      .save(
        payment,
      );
} catch (error: any) {
  /*
   * PostgreSQL 23505 = unique violation.
   *
   * gatewayMerchantTxnNo has a gateway-specific
   * unique index. If callback + reconciliation
   * settle the same verified ICICI transaction
   * concurrently, one insert may win while the
   * other reaches this catch.
   *
   * Never treat an arbitrary unique violation as
   * successful settlement. Reload and validate
   * the exact ICICI merchant transaction.
   */
  if (
    String(
      error?.code ||
      '',
    ) !== '23505'
  ) {
    throw error;
  }

  const concurrentPayment =
    await this
      .projectDealerPaymentRepository
      .findOne({
        where: {
          gatewayMerchantTxnNo:
            transaction.merchantTxnNo,
        },
      });

  /*
   * If no row exists for this merchantTxnNo,
   * then 23505 came from some other constraint.
   * Do not hide that database problem.
   */
  if (!concurrentPayment) {
    throw error;
  }

  /*
   * The concurrently-created row must belong
   * to exactly the same order, dealer and amount.
   */
  if (
    Number(
      concurrentPayment.dealerOrderId,
    ) !==
    Number(
      order.id,
    )
  ) {
    throw new BadRequestException(
      'ICICI transaction is already linked to another Dealer Order',
    );
  }

  if (
    Number(
      concurrentPayment.dealerId,
    ) !==
    Number(
      identity.businessDealerId,
    )
  ) {
    throw new BadRequestException(
      'ICICI transaction is already linked to another dealer',
    );
  }

  if (
    Math.abs(
      Number(
        concurrentPayment.amount ||
        0,
      ) -
        Number(
          transaction.amount ||
          0,
        ),
    ) > 0.009
  ) {
    throw new BadRequestException(
      'ICICI transaction amount does not match existing Dealer Order payment',
    );
  }

  /*
   * The winning settlement should have created
   * this gateway payment as APPROVED.
   *
   * Still repair the state if the row exists but
   * approval was not completed for any reason.
   */
  if (
    concurrentPayment.status !==
    ProjectDealerPaymentStatus.APPROVED
  ) {
    concurrentPayment.status =
      ProjectDealerPaymentStatus.APPROVED;

    concurrentPayment.approvedAt =
      transaction.paidAt ||
      new Date();

    concurrentPayment.approvalNote =
      'Automatically approved after verified ICICI payment success';

    savedPayment =
      await this
        .projectDealerPaymentRepository
        .save(
          concurrentPayment,
        );
  } else {
    savedPayment =
      concurrentPayment;
  }
}

await this.recalculateDealerOrderPaymentFromApprovedPayments(
  order.id,
);

await this.postDealerOrderGatewayLedger(
  savedPayment,
  order,
);

return savedPayment;
}

private async dispatchSuccessfulTransaction(
  transaction: IciciPaymentTransaction,
) {
  if (
    transaction.status !==
    IciciPaymentTransactionStatus.SUCCESS
  ) {
    return;
  }

  /*
   * Dealer Insurance
   *
   * Business rule:
   * all Dealer Portal payments are received
   * through ADITYA TRADING.
   */
  if (
    transaction.purpose ===
    IciciPaymentPurpose.DEALER_INSURANCE
  ) {
    if (
      transaction.merchantAccount !==
      IciciMerchantAccount.TRADING
    ) {
      throw new BadGatewayException(
        'Dealer insurance payment merchant mismatch',
      );
    }

    const requestId =
      Number(
        transaction.referenceId,
      );

    const dealerId =
      Number(
        transaction.dealerId,
      );

    if (
      !Number.isInteger(
        requestId,
      ) ||
      requestId <= 0 ||
      !Number.isInteger(
        dealerId,
      ) ||
      dealerId <= 0
    ) {
      throw new BadGatewayException(
        'Dealer insurance payment reference is invalid',
      );
    }

    const request =
      await this
        .projectInsuranceRequestRepository
        .findOne({
          where: {
            id:
              requestId,

            dealerId,

            source:
              ProjectInsuranceRequestSource
                .DEALER,

            isHidden:
              false,
          } as any,
        });

    if (!request) {
      throw new BadGatewayException(
        'Dealer insurance application not found for payment',
      );
    }

    const transactionAmount =
      Number(
        transaction.amount,
      );

    const payableAmount =
      Number(
        request.payableAmount,
      );

    if (
      !Number.isFinite(
        transactionAmount,
      ) ||
      !Number.isFinite(
        payableAmount,
      ) ||
      Math.abs(
        transactionAmount -
          payableAmount,
      ) > 0.009
    ) {
      throw new BadGatewayException(
        'Dealer insurance payment amount mismatch',
      );
    }

    /*
     * Idempotency:
     *
     * Callback, Status reconciliation or a
     * future repeated reconciliation must not
     * credit the insurance application twice.
     */
    if (
  request.paymentStatus ===
  ProjectInsurancePaymentStatus.PAID
) {
  const existingMerchantTxnNo =
    String(
      request.gatewayOrderId ||
      '',
    ).trim();

  const currentMerchantTxnNo =
    String(
      transaction.merchantTxnNo ||
      '',
    ).trim();

  /*
   * A PAID insurance request is idempotent
   * only when it was settled by this exact
   * ICICI merchant transaction.
   *
   * Callback/status reconciliation for the
   * same transaction may safely run again.
   */
  if (
    existingMerchantTxnNo &&
    currentMerchantTxnNo &&
    existingMerchantTxnNo ===
      currentMerchantTxnNo
  ) {
    return;
  }

  /*
   * Never silently accept a second SUCCESS
   * transaction against an already-paid
   * insurance request.
   *
   * Also fail closed for legacy/incomplete
   * PAID records where gatewayOrderId is
   * missing rather than overwriting their
   * payment identity.
   */
  throw new BadGatewayException(
    'Dealer insurance request is already paid by a different payment transaction',
  );
}

    request.paymentStatus =
      ProjectInsurancePaymentStatus.PAID;

    request.gatewayOrderId =
      transaction.merchantTxnNo;

    request.gatewayPaymentId =
      transaction.paymentId ||
      undefined;

    request.gatewayTransactionId =
      transaction.bankTxnId ||
      undefined;

    request.paidAt =
      transaction.paidAt ||
      new Date();

    await this
      .projectInsuranceRequestRepository
      .save(
        request,
      );

    return;
  }

    /*
   * Customer Insurance
   *
   * Business rule:
   * Customer Portal insurance payments are
   * received through ADITYA SOLARS.
   *
   * referenceId is the
   * ProjectInsuranceRequest.id.
   */
  if (
    transaction.purpose ===
      IciciPaymentPurpose.CUSTOMER_INSURANCE
  ) {
    if (
      transaction.merchantAccount !==
        IciciMerchantAccount.SOLARS
    ) {
      throw new BadGatewayException(
        'Customer insurance payment merchant mismatch',
      );
    }

    const requestId =
      Number(
        transaction.referenceId,
      );

    const customerId =
      Number(
        transaction.customerId,
      );

    if (
      !Number.isInteger(
        requestId,
      ) ||
      requestId <= 0 ||
      !Number.isInteger(
        customerId,
      ) ||
      customerId <= 0
    ) {
      throw new BadGatewayException(
        'Customer insurance payment reference is invalid',
      );
    }

    /*
     * Only a transaction created by the
     * hardened Customer Insurance initiation
     * path may settle an insurance request.
     */
    if (
      String(
        transaction
          .gatewayMetadata
          ?.businessSettlementType ||
        '',
      ) !==
        'CUSTOMER_INSURANCE'
    ) {
      throw new BadGatewayException(
        'Customer insurance payment settlement marker mismatch',
      );
    }

    const request =
      await this
        .projectInsuranceRequestRepository
        .findOne({
          where: {
            id:
              requestId,

            customerId,

            source:
              ProjectInsuranceRequestSource
                .CUSTOMER,

            isHidden:
              false,
          } as any,
        });

    if (!request) {
      throw new BadGatewayException(
        'Customer insurance application not found for payment',
      );
    }

    const transactionAmount =
      Number(
        transaction.amount,
      );

    const payableAmount =
      Number(
        request.payableAmount,
      );

    if (
      !Number.isFinite(
        transactionAmount,
      ) ||
      !Number.isFinite(
        payableAmount,
      ) ||
      Math.abs(
        transactionAmount -
          payableAmount,
      ) > 0.009
    ) {
      throw new BadGatewayException(
        'Customer insurance payment amount mismatch',
      );
    }

    /*
     * Idempotency:
     *
     * Repeated callback/status reconciliation
     * for the exact same ICICI transaction is
     * safe, but a different successful payment
     * must never overwrite an already-paid
     * insurance request.
     */
    if (
      request.paymentStatus ===
        ProjectInsurancePaymentStatus.PAID
    ) {
      const existingMerchantTxnNo =
        String(
          request.gatewayOrderId ||
          '',
        ).trim();

      const currentMerchantTxnNo =
        String(
          transaction.merchantTxnNo ||
          '',
        ).trim();

      if (
        existingMerchantTxnNo &&
        currentMerchantTxnNo &&
        existingMerchantTxnNo ===
          currentMerchantTxnNo
      ) {
        return;
      }

      throw new BadGatewayException(
        'Customer insurance request is already paid by a different payment transaction',
      );
    }

    request.paymentStatus =
      ProjectInsurancePaymentStatus.PAID;

    request.gatewayOrderId =
      transaction.merchantTxnNo;

    request.gatewayPaymentId =
      transaction.paymentId ||
      undefined;

    request.gatewayTransactionId =
      transaction.bankTxnId ||
      undefined;

    request.paidAt =
      transaction.paidAt ||
      new Date();

    await this
      .projectInsuranceRequestRepository
      .save(
        request,
      );

    return;
  }

  /*
 * Dealer Order settlement is intentionally
 * handled separately from Dealer Insurance.
 *
 * Do not create ProjectDealerPayment here
 * until the Dealer Order repositories and
 * existing payment recalculation rules are
 * registered in PaymentModule.
 */
if (
  transaction.purpose ===
  IciciPaymentPurpose.DEALER_ORDER
) {
  await this.settleDealerOrderTransaction(
    transaction,
  );

  return;
}

/*
 * Customer installment payment
 *
 * Business rule:
 * Customer Portal payments are received
 * through ADITYA SOLARS.
 *
 * referenceId is the
 * ProjectPaymentInstallment.id.
 */
if (
  transaction.purpose ===
  IciciPaymentPurpose.CUSTOMER_PAYMENT
) {
  if (
    transaction.merchantAccount !==
    IciciMerchantAccount.SOLARS
  ) {
    throw new BadGatewayException(
      'Customer payment merchant mismatch',
    );
  }

  const installmentId =
    Number(
      transaction.referenceId,
    );

  const customerId =
    Number(
      transaction.customerId,
    );

  const transactionAmount =
    Number(
      transaction.amount,
    );

  const merchantTxnNo =
    String(
      transaction.merchantTxnNo ||
      '',
    ).trim();

  if (
    !Number.isInteger(
      installmentId,
    ) ||
    installmentId <= 0 ||
    !Number.isInteger(
      customerId,
    ) ||
    customerId <= 0 ||
    !Number.isFinite(
      transactionAmount,
    ) ||
    transactionAmount <= 0 ||
    !merchantTxnNo
  ) {
    throw new BadGatewayException(
      'Customer payment transaction reference is invalid',
    );
  }

  /*
   * Only transactions created by the
   * hardened Customer Payment initiation
   * path may settle an installment.
   */
  if (
    String(
      transaction
        .gatewayMetadata
        ?.businessSettlementType ||
      '',
    ) !==
      'CUSTOMER_PAYMENT'
  ) {
    throw new BadGatewayException(
      'Customer payment settlement marker is invalid',
    );
  }

  await this
    .projectService
    .settleIciciCustomerInstallmentPayment({
      installmentId,
      customerId,
      amount:
        transactionAmount,
      merchantTxnNo,
      bankTxnId:
        transaction.bankTxnId ||
        null,
      paymentId:
        transaction.paymentId ||
        null,
      paidAt:
        transaction.paidAt ||
        new Date(),
    });

  return;
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

  /*
 * ICICI Status API can return JSON boolean false
 * values such as:
 *
 *   oth_charge: false
 *
 * ICICI excludes those false-valued parameters
 * when calculating the Status response secureHash.
 *
 * Do not modify statusResponse itself because the
 * original response is still needed below for
 * reconciliation and metadata.
 */
const statusHashPayload =
  Object.fromEntries(
    Object.entries(
      statusResponse,
    ).filter(
      ([key, value]) =>
        key !== 'secureHash' &&
        value !== false,
    ),
  );

const expectedSecureHash =
  this.createSecureHash(
    statusHashPayload,
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

  const savedTransaction =
  await this
    .transactionRepository
    .save(
      transaction,
    );

if (
  savedTransaction.status ===
  IciciPaymentTransactionStatus.SUCCESS
) {
  try {
    await this
      .dispatchSuccessfulTransaction(
        savedTransaction,
      );

    savedTransaction.gatewayMetadata = {
      ...(
        savedTransaction
          .gatewayMetadata ||
        {}
      ),

      businessSettlementStatus:
        'SETTLED',

      businessSettlementAt:
        new Date()
          .toISOString(),

      businessSettlementError:
        null,
    };

    await this
      .transactionRepository
      .save(
        savedTransaction,
      );
  } catch (error: any) {
    /*
     * IMPORTANT:
     *
     * ICICI payment SUCCESS and our internal
     * business allocation are two different
     * facts.
     *
     * Once ICICI Status has been securely
     * verified as SUCCESS, never downgrade or
     * hide that successful bank transaction
     * merely because the business record could
     * not be allocated automatically.
     *
     * Example:
     * the installment balance changed while
     * the customer was completing payment.
     *
     * Keep the bank transaction SUCCESS and
     * retain the allocation failure for manual
     * reconciliation.
     */
    savedTransaction.gatewayMetadata = {
      ...(
        savedTransaction
          .gatewayMetadata ||
        {}
      ),

      businessSettlementStatus:
        'REQUIRES_RECONCILIATION',

      businessSettlementFailedAt:
        new Date()
          .toISOString(),

      businessSettlementError:
        String(
          error?.message ||
          'Business settlement failed',
        ).slice(
          0,
          500,
        ),
    };

    await this
      .transactionRepository
      .save(
        savedTransaction,
      );
  }
}

return savedTransaction;
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

merchantAccount:
  reconciledTransaction
    .merchantAccount,

status:
  reconciledTransaction
    .status,

paymentSuccessful:
  reconciledTransaction
    .status ===
  IciciPaymentTransactionStatus.SUCCESS,
};
}

async getPublicPaymentResult(
  transactionId: number,
) {
  const id =
    Number(
      transactionId,
    );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new BadRequestException(
      'Invalid payment transaction',
    );
  }

  const transaction =
    await this
      .transactionRepository
      .findOne({
        where: {
          id,
        },
      });

  if (!transaction) {
    throw new BadRequestException(
      'Payment transaction not found',
    );
  }

  /*
   * This endpoint is intentionally
   * display-only.
   *
   * Do NOT expose:
   * - dealerId
   * - referenceId
   * - merchant IDs
   * - bank transaction IDs
   * - payment IDs
   * - gateway metadata
   * - redirect URI / tranCtx
   */
  const gatewayMetadata =
  transaction.gatewayMetadata &&
  typeof transaction.gatewayMetadata ===
    'object'
    ? transaction.gatewayMetadata
    : {};

const paymentSource =
  gatewayMetadata?.paymentSource ===
  'APP'
    ? 'APP'
    : 'WEB';

    const businessSettlementStatus =
  String(
    transaction
      .gatewayMetadata
      ?.businessSettlementStatus ||
      '',
  ).trim();

const publicBusinessSettlementStatus =
  businessSettlementStatus ===
  'SETTLED'
    ? 'SETTLED'
    : businessSettlementStatus ===
        'REQUIRES_RECONCILIATION'
      ? 'REQUIRES_RECONCILIATION'
      : null;

return {
  transactionId:
    transaction.id,

  purpose:
    transaction.purpose,

  amount:
    Number(
      transaction.amount,
    ),

  status:
    transaction.status,

  paymentSuccessful:
    transaction.status ===
    IciciPaymentTransactionStatus
      .SUCCESS,

  paidAt:
    transaction.paidAt ||
    null,

  paymentSource,

  businessSettlementStatus:
  publicBusinessSettlementStatus,
};
}
}