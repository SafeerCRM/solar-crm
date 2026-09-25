import {
  Body,
  Controller,
  Get,
  Param,
ParseIntPipe,
Query,
Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,

} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CustomerPortalService } from './customer-portal.service';
import * as jwt from 'jsonwebtoken';
import { IciciPaymentLaunchService } from '../payment/icici-payment-launch.service';
import {
  IciciPaymentLaunchPurpose,
} from '../payment/icici-payment-launch.entity';

@Controller('customer-auth')
export class CustomerAuthController {
  constructor(
  private readonly service: CustomerPortalService,
  private readonly iciciPaymentLaunchService: IciciPaymentLaunchService,
) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.service.customerLogin(body.username, body.password);
  }

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    const authHeader = req.headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Customer token missing');
    }

    const payload: any = jwt.verify(token, 'mysecretkey');

    if (!payload?.customerId) {
      throw new UnauthorizedException('Invalid customer token');
    }

    return this.service.getCustomerDashboard(Number(payload.customerId));
  }

  @Post('complaints')
async createCustomerComplaint(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createComplaint(
    {
      ...body,
      customerId: Number(payload.customerId),
      customerCode: payload.customerCode,
    },
    {
      id: Number(payload.customerId),
      name: payload.customerCode,
      roles: ['CUSTOMER'],
    },
  );
}

@Post('complaint-attachments/upload')
@UseInterceptors(FilesInterceptor('files', 10))
async uploadComplaintAttachments(
  @Req() req: any,
  @UploadedFiles() files: any[],
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.uploadComplaintAttachments(
    files,
    {
      id: Number(payload.customerId),
      name: payload.customerCode,
      roles: ['CUSTOMER'],
    },
  );
}

@Get('complaints/:id/activities')
async getCustomerComplaintActivities(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.getCustomerComplaintActivities(
    id,
    Number(payload.customerId),
  );
}

@Patch('notifications/read-all')
async markAllNotificationsRead(@Req() req: any) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.markAllCustomerNotificationsRead(
    Number(payload.customerId),
  );
}

@Get('staff-directory')
async getCustomerStaffDirectory(@Req() req: any) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.getCustomerStaffDirectory();
}

@Post('cleaning-reminders')
async createCustomerCleaningReminder(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createCleaningReminder({
    ...body,
    customerId: Number(payload.customerId),
    customerCode: payload.customerCode,
    status: 'PENDING',
  });
}

@Post('referrals')
async createCustomerReferral(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createReferral({
    ...body,
    customerId: Number(payload.customerId),
    customerCode: payload.customerCode,
  });
}

@Post('work-date-requests')
async createCustomerWorkDateRequest(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createWorkDateRequest({
    ...body,
    customerId: Number(payload.customerId),
    customerCode: payload.customerCode,
  });
}

@Post('payments/installments/:installmentId/launch')
async createCustomerInstallmentPaymentLaunch(
  @Req() req: any,
  @Param('installmentId') installmentId: string,
  @Body() body: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  const customerId =
    Number(
      payload?.customerId,
    );

  const normalizedInstallmentId =
    Number(
      installmentId,
    );

  if (
    !Number.isInteger(customerId) ||
    customerId <= 0
  ) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  if (
    !Number.isInteger(
      normalizedInstallmentId,
    ) ||
    normalizedInstallmentId <= 0
  ) {
    throw new BadRequestException(
      'Invalid payment installment',
    );
  }

  const paymentSource =
    String(
      body?.paymentSource ||
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

  /*
   * Validate customer ownership and the
   * current installment state before
   * issuing the public one-time token.
   */
  await this.service
    .validateCustomerInstallmentPaymentLaunch(
      customerId,
      normalizedInstallmentId,
    );

  /*
   * referenceId for CUSTOMER_PAYMENT is
   * the ProjectPaymentInstallment.id.
   */
  const launchToken =
    await this.iciciPaymentLaunchService
      .createCustomerLaunchToken({
  purpose:
    IciciPaymentLaunchPurpose
      .CUSTOMER_PAYMENT,

  referenceId:
          normalizedInstallmentId,

        customerId,

        paymentSource:
          paymentSource as
            | 'APP'
            | 'WEB',
      });

  const websiteBaseUrl =
    String(
      process.env
        .ICICI_PAYMENT_LAUNCH_BASE_URL ||
      '',
    )
      .trim()
      .replace(/\/+$/, '');

  if (
    websiteBaseUrl !==
    'https://adityasolars.co.in'
  ) {
    throw new Error(
      'ICICI_PAYMENT_LAUNCH_BASE_URL is not configured correctly',
    );
  }

  return {
    launchUrl:
      `${websiteBaseUrl}/payment/launch#flow=customer&token=${encodeURIComponent(
        launchToken,
      )}`,
  };
}

@Post('insurance/requests/:requestId/launch')
async createCustomerInsurancePaymentLaunch(
  @Req() req: any,
  @Param('requestId') requestId: string,
  @Body() body: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  const customerId =
    Number(
      payload?.customerId,
    );

  const normalizedRequestId =
    Number(
      requestId,
    );

  if (
    !Number.isInteger(customerId) ||
    customerId <= 0
  ) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  if (
    !Number.isInteger(
      normalizedRequestId,
    ) ||
    normalizedRequestId <= 0
  ) {
    throw new BadRequestException(
      'Invalid insurance request',
    );
  }

  const paymentSource =
    String(
      body?.paymentSource ||
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

  /*
   * Validate ownership, request state and
   * payable amount before issuing the
   * public one-time launch token.
   */
  await this.service
    .validateCustomerInsurancePaymentLaunch(
      customerId,
      normalizedRequestId,
    );

  /*
   * referenceId for CUSTOMER_INSURANCE is
   * ProjectInsuranceRequest.id.
   */
  const launchToken =
    await this.iciciPaymentLaunchService
      .createCustomerLaunchToken({
        purpose:
          IciciPaymentLaunchPurpose
            .CUSTOMER_INSURANCE,

        referenceId:
          normalizedRequestId,

        customerId,

        paymentSource:
          paymentSource as
            | 'APP'
            | 'WEB',
      });

  const websiteBaseUrl =
    String(
      process.env
        .ICICI_PAYMENT_LAUNCH_BASE_URL ||
      '',
    )
      .trim()
      .replace(/\/+$/, '');

  if (
    !websiteBaseUrl ||
    !/^https:\/\//i.test(
      websiteBaseUrl,
    )
  ) {
    throw new BadRequestException(
      'Payment launch website is not configured',
    );
  }

  return {
    success: true,

    launchUrl:
      `${websiteBaseUrl}/payment/launch` +
      `#flow=customer&token=${encodeURIComponent(
        launchToken,
      )}`,
  };
}

@Post('payment-receipts')
async createCustomerPaymentReceipt(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createPaymentReceipt({
    ...body,
    customerId: Number(payload.customerId),
    customerCode: payload.customerCode,
  });
}

@Post('payment-receipts/upload')
@UseInterceptors(FilesInterceptor('files', 5))
async uploadPaymentReceipts(
  @Req() req: any,
  @UploadedFiles() files: any[],
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.uploadPaymentReceipts(files, {
    id: Number(payload.customerId),
    name: payload.customerCode,
    roles: ['CUSTOMER'],
  });
}

@Patch('notifications/:id/read')
async markNotificationRead(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.markNotificationRead(id, Number(payload.customerId));
}

@Get('documents')
async getCustomerDocuments(
  @Req() req: any,
  @Query() query: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.getCustomerDocuments(
    Number(payload.customerId),
    query,
  );
}

@Get('policies')
async getCustomerPolicies(@Req() req: any) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.listPortalPoliciesForCustomer();
}

@Get('after-sales-services')
async getCustomerAfterSalesServices(@Req() req: any) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.listAfterSalesServices({
    customerVisible: 'true',
  });
}

@Get('after-sales-requests')
async getCustomerAfterSalesRequests(
  @Req() req: any,
  @Query() query: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.listAfterSalesRequests({
  customerId: Number(payload.customerId),
  page: Number(query?.page || 1),
  limit: Number(query?.limit || 10),
  status: query?.status || '',
});
}

@Post('after-sales-attachments/upload')
@UseInterceptors(
  FilesInterceptor('files', 10),
)
async uploadAfterSalesAttachments(
  @Req() req: any,
  @UploadedFiles() files: any[],
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service
    .uploadAfterSalesAttachments(
      files,
      {
        id: Number(
          payload.customerId,
        ),
        name:
          payload.customerCode,
        roles: ['CUSTOMER'],
      },
    );
}

@Post('after-sales-requests')
async createCustomerAfterSalesRequest(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createAfterSalesRequestFromCustomer(
    Number(payload.customerId),
    body,
  );
}

@Post('after-sales-requests/:requestId/launch')
async createCustomerAfterSalesPaymentLaunch(
  @Req() req: any,
  @Param('requestId') requestId: string,
  @Body() body: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  const customerId =
    Number(
      payload?.customerId,
    );

  const normalizedRequestId =
    Number(
      requestId,
    );

  if (
    !Number.isInteger(customerId) ||
    customerId <= 0
  ) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  if (
    !Number.isInteger(
      normalizedRequestId,
    ) ||
    normalizedRequestId <= 0
  ) {
    throw new BadRequestException(
      'Invalid after-sales request',
    );
  }

  const paymentSource =
    String(
      body?.paymentSource ||
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

  /*
   * Validate ownership, payment state and
   * snapshotted service amount before issuing
   * the public one-time launch token.
   */
  await this.service
    .validateCustomerAfterSalesPaymentLaunch(
      customerId,
      normalizedRequestId,
    );

  /*
   * referenceId for CUSTOMER_AFTER_SALES is
   * CustomerAfterSalesRequest.id.
   */
  const launchToken =
    await this.iciciPaymentLaunchService
      .createCustomerLaunchToken({
        purpose:
          IciciPaymentLaunchPurpose
            .CUSTOMER_AFTER_SALES,
        referenceId:
          normalizedRequestId,
        customerId,
        paymentSource:
          paymentSource as
            | 'APP'
            | 'WEB',
      });

  const websiteBaseUrl =
    String(
      process.env
        .ICICI_PAYMENT_LAUNCH_BASE_URL ||
      '',
    )
      .trim()
      .replace(/\/+$/, '');

  if (
    websiteBaseUrl !==
    'https://adityasolars.co.in'
  ) {
    throw new Error(
      'ICICI_PAYMENT_LAUNCH_BASE_URL is not configured correctly',
    );
  }

  return {
    launchUrl:
      `${websiteBaseUrl}/payment/launch#flow=customer&token=${encodeURIComponent(
        launchToken,
      )}`,
  };
}

@Get('after-sales-requests/:id/activities')
async getCustomerAfterSalesRequestActivities(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.getAfterSalesRequestActivities(id);
}

@Post('after-sales-requests/:id/rating')
async submitAfterSalesRequestRating(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.submitAfterSalesRequestRating(
    Number(payload.customerId),
    id,
    body,
  );
}

@Get('insurance/my')
async getMyInsuranceOverview(
  @Req() req: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service
    .getMyInsuranceOverview({
      id: Number(
        payload.customerId,
      ),
      customerId: Number(
        payload.customerId,
      ),
      customerCode:
        payload.customerCode,
      roles: ['CUSTOMER'],
    });
}

@Get('insurance/plans')
async getMyAvailableInsurancePlans(
  @Req() req: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service
    .getMyAvailableInsurancePlans({
      id: Number(
        payload.customerId,
      ),
      customerId: Number(
        payload.customerId,
      ),
      customerCode:
        payload.customerCode,
      roles: ['CUSTOMER'],
    });
}

@Get(
  'insurance/:insuranceId/documents',
)
async getMyInsuranceDocuments(
  @Req() req: any,

  @Param(
    'insuranceId',
    ParseIntPipe,
  )
  insuranceId: number,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service
    .getMyInsuranceDocuments(
      insuranceId,
      {
        id: Number(
          payload.customerId,
        ),
        customerId: Number(
          payload.customerId,
        ),
        customerCode:
          payload.customerCode,
        roles: ['CUSTOMER'],
      },
    );
}

@Post('insurance/request')
async createMyInsuranceRequest(
  @Req() req: any,

  @Body()
  body: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service
    .createMyInsuranceRequest(
      body,
      {
        id: Number(
          payload.customerId,
        ),
        customerId: Number(
          payload.customerId,
        ),
        customerCode:
          payload.customerCode,
        roles: ['CUSTOMER'],
      },
    );
}

@Post(
  'insurance/:insuranceId/renew',
)
async createMyInsuranceRenewalRequest(
  @Req() req: any,

  @Param(
    'insuranceId',
    ParseIntPipe,
  )
  insuranceId: number,

  @Body()
  body: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service
    .createMyInsuranceRenewalRequest(
      insuranceId,
      body,
      {
        id: Number(
          payload.customerId,
        ),
        customerId: Number(
          payload.customerId,
        ),
        customerCode:
          payload.customerCode,
        roles: ['CUSTOMER'],
      },
    );
}

@Post(
  'insurance/:insuranceId/documents/upload',
)
@UseInterceptors(
  FilesInterceptor(
    'files',
    5,
    {
      limits: {
        fileSize:
          12 * 1024 * 1024,
      },
    },
  ),
)
async uploadMyInsuranceDocuments(
  @Req()
  req: any,

  @Param(
    'insuranceId',
    ParseIntPipe,
  )
  insuranceId: number,

  @UploadedFiles()
  files: any[],

  @Body()
  body: any,
) {
  const authHeader =
    req.headers
      ?.authorization ||
    '';

  const token =
    authHeader.replace(
      'Bearer ',
      '',
    );

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (
    !payload
      ?.customerId
  ) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service
    .uploadMyInsuranceDocuments(
      insuranceId,
      files,
      body,
      {
        id: Number(
          payload.customerId,
        ),

        customerId:
          Number(
            payload.customerId,
          ),

        customerCode:
          payload.customerCode,

        roles: [
          'CUSTOMER',
        ],
      },
    );
}

@Get('payment-receipts/:id/activities')
async getPaymentReceiptActivities(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.getCustomerPaymentReceiptActivities(
    id,
    Number(payload.customerId),
  );
}

@Patch('projects/:projectId/site-location')
async updateProjectSiteLocation(
  @Req() req: any,
  @Param('projectId', ParseIntPipe) projectId: number,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any = jwt.verify(
    token,
    'mysecretkey',
  );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service.updateProjectSiteLocation(
    Number(payload.customerId),
    projectId,
    body,
  );
}

@Post('device-token')
async registerCustomerDeviceToken(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service.registerCustomerDeviceToken(
    Number(payload.customerId),
    body,
  );
}

@Post('test-push')
async sendCustomerTestPush(
  @Req() req: any,
) {
  const authHeader =
    req.headers?.authorization || '';

  const token =
    authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException(
      'Customer token missing',
    );
  }

  const payload: any =
    jwt.verify(
      token,
      'mysecretkey',
    );

  if (!payload?.customerId) {
    throw new UnauthorizedException(
      'Invalid customer token',
    );
  }

  return this.service.sendCustomerTestPush(
    Number(payload.customerId),
  );
}

@Patch('change-password')
async changeCustomerPassword(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.changeCustomerPortalPassword(
    Number(payload.customerId),
    body,
  );
}
}