import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';
import {
  InjectDataSource,
  InjectRepository,
} from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
} from 'typeorm';

import {
  CustomerAfterSalesCheckout,
  CustomerAfterSalesCheckoutStatus,
} from './customer-after-sales-checkout.entity';

import {
  CustomerAfterSalesPaymentStatus,
  CustomerAfterSalesRequest,
  CustomerAfterSalesRequestStatus,
} from './customer-after-sales-request.entity';

import {
  CustomerAfterSalesRequestProof,
  CustomerAfterSalesProofType,
} from './customer-after-sales-request-proof.entity';

import {
  CustomerAfterSalesRequestActivity,
} from './customer-after-sales-request-activity.entity';

type FinalizePaidCheckoutInput = {
  checkoutId: number;
  customerId: number;
  amount: number;
  merchantTxnNo: string;
  paymentId?: string | null;
  bankTxnId?: string | null;
  paidAt?: Date | null;
};

@Injectable()
export class CustomerAfterSalesCheckoutFinalizerService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(CustomerAfterSalesCheckout)
    private readonly checkoutRepository:
      Repository<CustomerAfterSalesCheckout>,
  ) {}

  async finalizePaidCheckout(
    input: FinalizePaidCheckoutInput,
  ) {
    const checkoutId =
      Number(input.checkoutId);

    const customerId =
      Number(input.customerId);

    const transactionAmount =
      Number(input.amount);

    const merchantTxnNo =
      String(
        input.merchantTxnNo || '',
      ).trim();

    if (
      !Number.isInteger(checkoutId) ||
      checkoutId <= 0 ||
      !Number.isInteger(customerId) ||
      customerId <= 0 ||
      !Number.isFinite(transactionAmount) ||
      transactionAmount <= 0 ||
      !merchantTxnNo
    ) {
      throw new BadGatewayException(
        'Customer after-sales checkout payment reference is invalid',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        /*
         * Lock the checkout so callback + status
         * reconciliation cannot create two real
         * requests from the same paid checkout.
         */
        const checkout =
          await manager
            .getRepository(
              CustomerAfterSalesCheckout,
            )
            .createQueryBuilder(
              'checkout',
            )
            .setLock(
              'pessimistic_write',
            )
            .where(
              'checkout.id = :checkoutId',
              {
                checkoutId,
              },
            )
            .andWhere(
              'checkout.customerId = :customerId',
              {
                customerId,
              },
            )
            .getOne();

        if (!checkout) {
          throw new BadGatewayException(
            'Customer after-sales checkout not found for payment',
          );
        }

        /*
         * Idempotency:
         *
         * If this exact ICICI payment already
         * completed the checkout, repeated
         * callback/status reconciliation is safe.
         */
        if (
          checkout.status ===
            CustomerAfterSalesCheckoutStatus.COMPLETED &&
          checkout.createdRequestId
        ) {
          if (
            String(
              checkout.gatewayOrderId ||
                '',
            ).trim() ===
            merchantTxnNo
          ) {
            return {
              requestId:
                Number(
                  checkout.createdRequestId,
                ),
              alreadyCompleted: true,
            };
          }

          throw new BadGatewayException(
            'Customer after-sales checkout was completed by a different payment transaction',
          );
        }

        if (
          checkout.status ===
          CustomerAfterSalesCheckoutStatus.CANCELLED
        ) {
          throw new BadGatewayException(
            'Customer after-sales checkout has been cancelled',
          );
        }

        const payableAmount =
          Number(
            checkout.servicePrice,
          );

        if (
          !Number.isFinite(
            payableAmount,
          ) ||
          payableAmount <= 0 ||
          Math.abs(
            transactionAmount -
              payableAmount,
          ) > 0.009
        ) {
          throw new BadGatewayException(
            'Customer after-sales checkout payment amount mismatch',
          );
        }

        /*
         * Only now — after verified payment —
         * create the actual staff-visible
         * After-Sales Request.
         */
        const request: any =
  new CustomerAfterSalesRequest();

        request.customerId =
          checkout.customerId;

        request.customerCode =
          checkout.customerCode || '';

        request.customerName =
          checkout.customerName || '';

        request.customerPhone =
          checkout.customerPhone || '';

        request.projectId =
  checkout.projectId || null;

        request.projectName =
          checkout.projectName || '';

        request.branchName =
          checkout.branchName || '';

        request.projectOwnerId =
  checkout.projectOwnerId || null;

        request.projectOwnerName =
          checkout.projectOwnerName ||
          '';

        request.serviceId =
          checkout.serviceId;

        request.serviceName =
          checkout.serviceName;

        request.serviceCategory =
          checkout.serviceCategory || '';

        request.servicePrice =
          Number(
            checkout.servicePrice,
          );

        request.isPaidService =
          true;

        request.preferredDate =
  checkout.preferredDate || null;

        request.customerRemarks =
          checkout.customerRemarks ||
          '';

        /*
         * Operational workflow still begins NEW.
         * Payment must not approve/process it.
         */
        request.status =
          CustomerAfterSalesRequestStatus.NEW;

        request.paymentStatus =
          CustomerAfterSalesPaymentStatus.PAID;

        request.gatewayOrderId =
          merchantTxnNo;

        request.gatewayPaymentId =
          String(
            input.paymentId || '',
          );

        request.gatewayTransactionId =
          String(
            input.bankTxnId || '',
          );

        request.paidAt =
          input.paidAt ||
          new Date();

        const savedRequest =
          await manager
            .getRepository(
              CustomerAfterSalesRequest,
            )
            .save(
              request,
            );

        const attachments =
          Array.isArray(
            checkout.customerAttachments,
          )
            ? checkout.customerAttachments
            : [];

        let savedAttachmentCount = 0;

        for (
          const attachment
          of attachments
        ) {
          if (
            !attachment?.fileUrl
          ) {
            continue;
          }

          const mimeType =
            String(
              attachment.mimeType ||
                '',
            );

          const isImage =
            mimeType.startsWith(
              'image/',
            ) ||
            attachment
              .attachmentType ===
              'IMAGE';

          const isAudio =
            mimeType.startsWith(
              'audio/',
            ) ||
            mimeType ===
              'video/webm' ||
            attachment
              .attachmentType ===
              'AUDIO';

          if (
            !isImage &&
            !isAudio
          ) {
            continue;
          }

          const proof =
            new CustomerAfterSalesRequestProof();

          proof.requestId =
            savedRequest.id;

          proof.proofType =
            isImage
              ? CustomerAfterSalesProofType
                  .CUSTOMER_PHOTO
              : CustomerAfterSalesProofType
                  .CUSTOMER_AUDIO;

          proof.fileUrl =
            String(
              attachment.fileUrl,
            );

          proof.fileName =
            String(
              attachment.fileName ||
                '',
            );

          proof.mimeType =
            mimeType;

          proof.remarks =
            '';

          proof.uploadedBy =
            checkout.customerId;

          proof.uploadedByName =
            checkout.customerName ||
            checkout.customerCode ||
            'Customer';

          await manager
            .getRepository(
              CustomerAfterSalesRequestProof,
            )
            .save(
              proof,
            );

          savedAttachmentCount += 1;
        }

        const createdActivity: any =
  new CustomerAfterSalesRequestActivity();

        createdActivity.requestId =
          savedRequest.id;

        createdActivity.activityType =
          'REQUEST_CREATED';

        createdActivity.activityTitle =
          'Service Request Created';

        createdActivity.activityDescription =
          `Customer requested "${savedRequest.serviceName}".`;

        createdActivity.performedBy =
  null;

        createdActivity.performedByName =
          'System';

        await manager
          .getRepository(
            CustomerAfterSalesRequestActivity,
          )
          .save(
            createdActivity,
          );

        if (
          savedAttachmentCount > 0
        ) {
          const attachmentActivity: any =
  new CustomerAfterSalesRequestActivity();

          attachmentActivity.requestId =
            savedRequest.id;

          attachmentActivity.activityType =
            'CUSTOMER_ATTACHMENTS_UPLOADED';

          attachmentActivity.activityTitle =
            'Customer Attachments Uploaded';

          attachmentActivity.activityDescription =
            `${savedAttachmentCount} attachment(s) uploaded by customer.`;

          attachmentActivity.performedBy =
  null;

          attachmentActivity.performedByName =
            'System';

          await manager
            .getRepository(
              CustomerAfterSalesRequestActivity,
            )
            .save(
              attachmentActivity,
            );
        }

        checkout.status =
          CustomerAfterSalesCheckoutStatus.COMPLETED;

        checkout.createdRequestId =
          savedRequest.id;

        checkout.gatewayOrderId =
          merchantTxnNo;

        checkout.paidAt =
          input.paidAt ||
          new Date();

        checkout.completedAt =
          new Date();

        await manager
          .getRepository(
            CustomerAfterSalesCheckout,
          )
          .save(
            checkout,
          );

        return {
          requestId:
            Number(
              savedRequest.id,
            ),
          alreadyCompleted: false,
        };
      },
    );
  }
}