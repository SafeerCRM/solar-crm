import {
  Body,
  Controller,
  Get,
  Param,
ParseIntPipe,
Patch,
Query,
  Post,
  Req,
  Res,
  BadRequestException,
  UnauthorizedException,
  UploadedFiles,
  UploadedFile,
UseInterceptors,
} from '@nestjs/common';
import { DealerService } from './dealer.service';
import { IciciPaymentLaunchService } from '../payment/icici-payment-launch.service';
import {
  IciciPaymentLaunchPurpose,
} from '../payment/icici-payment-launch.entity';
import * as jwt from 'jsonwebtoken';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@Controller('dealer-auth')
export class DealerAuthController {
  constructor(
  private readonly service: DealerService,

  private readonly paymentLaunchService:
    IciciPaymentLaunchService,
) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.service.dealerLogin(body.username, body.password);
  }

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerDashboard(Number(payload.dealerId));
  }

    @Get('stock')
  async stock(@Req() req: any) {
    this.getDealerPayload(req);

    return this.service.getDealerStock();
  }

    @Get('bank-details')
  async bankDetails(@Req() req: any) {
    this.getDealerPayload(req);

    return this.service.getBankDetails();
  }

  @Get('policies')
async policies(@Req() req: any) {
  this.getDealerPayload(req);

  return this.service.listPortalPoliciesForDealer();
}

    @Get('staff-contacts')
  async staffContacts(@Req() req: any) {
    this.getDealerPayload(req);

    return this.service.getDealerStaffContacts();
  }

    @Post('orders')
  async createOrder(@Req() req: any, @Body() body: any) {
    const payload = this.getDealerPayload(req);

    return this.service.createDealerOrder(Number(payload.dealerId), body);
  }

    @Get('orders')
  async listOrders(@Req() req: any, @Query() query: any) {
    const payload = this.getDealerPayload(req);

    return this.service.listDealerOrders(Number(payload.dealerId), query);
  }

  @Get('orders/:id')
  async getOrderDetail(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerOrderDetail(Number(payload.dealerId), id);
  }

  @Post(
  'orders/:id/payment/launch',
)
async createDealerOrderPaymentLaunch(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @Body()
  body: any,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  const dealerId =
    Number(
      payload.dealerId,
    );

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
   * Ownership validation.
   */
  await this.service
    .getDealerOrderDetail(
      dealerId,
      Number(id),
    );

  const token =
    await this.paymentLaunchService
      .createDealerLaunchToken({
        purpose:
          IciciPaymentLaunchPurpose
            .DEALER_ORDER,

        referenceId:
          Number(id),

        dealerId,

        paymentSource,
      });

  const websiteBaseUrl =
    String(
      process.env
        .ICICI_PAYMENT_LAUNCH_BASE_URL ||
        '',
    )
      .trim()
      .replace(
        /\/+$/,
        '',
      );

  if (
    websiteBaseUrl !==
    'https://adityasolars.co.in'
  ) {
    throw new BadRequestException(
      'Payment launch website is not configured',
    );
  }

  return {
    success: true,

    launchUrl:
      `${websiteBaseUrl}/payment/launch#token=${encodeURIComponent(
        token,
      )}`,
  };
}

  @Post('orders/:id/payment/initiate')
async initiateDealerOrderPayment(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  /*
   * Dealer identity comes only from the
   * authenticated Dealer Portal JWT.
   */
  const payload =
    this.getDealerPayload(
      req,
    );

  /*
   * Return URL is backend-controlled.
   *
   * Never accept this value from the
   * Dealer Portal request.
   */
  const returnUrl =
    String(
      process.env
        .ICICI_PAYMENT_RETURN_URL ||
        '',
    ).trim();

  if (
    !returnUrl ||
    !/^https:\/\//i.test(
      returnUrl,
    )
  ) {
    throw new BadRequestException(
      'ICICI payment return URL is not configured',
    );
  }

  return this.service
    .initiateDealerOrderIciciPayment(
      Number(
        payload.dealerId,
      ),
      Number(
        id,
      ),
      returnUrl,
    );
}

  @Get('orders/:id/documents')
async getOrderDocuments(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  return this.service
    .getDealerOrderDocumentsForPortal(
      Number(
        payload.dealerId,
      ),
      id,
    );
}

@Post(
  'orders/:id/documents/upload',
)
@UseInterceptors(
  FileInterceptor(
    'file',
    {
      limits: {
        fileSize:
          10 * 1024 * 1024,
      },
    },
  ),
)
async uploadOrderDocument(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @UploadedFile()
  file: any,

  @Body()
  body: any,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  return this.service
    .uploadDealerOrderDocumentForPortal(
      Number(
        payload.dealerId,
      ),
      id,
      file,
      body,
      {
        id:
          Number(
            payload.dealerId,
          ),

        name:
          payload.dealerName ||
          '',

        dealerName:
          payload.dealerName ||
          '',

        roles: [
          'DEALER',
        ],
      },
    );
}

@Get(
  'orders/:id/documents/suggestions',
)
async getOrderDocumentSuggestions(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @Query()
  query: any,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  return this.service
    .getDealerOrderDocumentSuggestionsForPortal(
      Number(
        payload.dealerId,
      ),
      id,
      query,
    );
}

@Patch(
  'orders/:id/documents/:documentId',
)
async updateOrderDocument(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @Param(
    'documentId',
    ParseIntPipe,
  )
  documentId: number,

  @Body()
  body: any,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  return this.service
    .updateDealerOrderDocumentForPortal(
      Number(
        payload.dealerId,
      ),
      id,
      documentId,
      body,
      {
        id:
          Number(
            payload.dealerId,
          ),

        name:
          payload.dealerName ||
          '',

        dealerName:
          payload.dealerName ||
          '',

        roles: [
          'DEALER',
        ],
      },
    );
}

    @Get('orders/:id/proforma-invoice')
  async getOrderProformaInvoice(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerOrderProformaInvoice(
      Number(payload.dealerId),
      id,
    );
  }

  @Get('orders/:id/final-invoice')
  async getOrderFinalInvoice(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerOrderFinalInvoice(
      Number(payload.dealerId),
      id,
    );
  }

  @Get('kits')
async kits(@Req() req: any) {
  this.getDealerPayload(req);

  return this.service.listDealerKitsForPortal();
}

    @Get('analytics')
  async analytics(@Req() req: any) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerAnalytics(Number(payload.dealerId));
  }

  @Post('payment-gateway/icici/website-test')
async initiateIciciTradingWebsiteTestPayment(
  @Req() req: any,
) {
  const origin =
    String(
      req.headers?.origin ||
        '',
    )
      .trim()
      .toLowerCase();

  if (
    origin !==
    'https://adityasolars.co.in'
  ) {
    throw new UnauthorizedException(
      'Website payment test not allowed',
    );
  }

  const returnUrl =
    String(
      process.env
        .ICICI_PAYMENT_RETURN_URL ||
        '',
    ).trim();

  if (
    !returnUrl ||
    !/^https:\/\//i.test(
      returnUrl,
    )
  ) {
    throw new BadRequestException(
      'ICICI payment return URL is not configured',
    );
  }

  return this.service
    .initiateIciciTradingWebsiteTestPayment(
      returnUrl,
    );
}

@Post('payment-gateway/icici/reconcile-test')
async reconcileIciciTestPayment(
  @Req() req: any,
  @Body() body: any,
) {
  /*
   * Require a valid Dealer Portal JWT.
   * This endpoint is temporary and will
   * be removed after gateway testing.
   */
  this.getDealerPayload(req);

  const transactionId =
    Number(
      body?.transactionId,
    );

  if (
    !Number.isInteger(
      transactionId,
    ) ||
    transactionId <= 0
  ) {
    throw new BadRequestException(
      'Valid transaction ID is required',
    );
  }

  return this.service
    .reconcileIciciTestPayment(
      transactionId,
    );
}

  @Post('payment-gateway/icici/trading-test')
async initiateIciciTradingTestPayment(
  @Req() req: any,
) {
  const payload =
    this.getDealerPayload(req);

  const returnUrl =
    String(
      process.env
        .ICICI_PAYMENT_RETURN_URL ||
        '',
    ).trim();

  if (
    !returnUrl ||
    !/^https:\/\//i.test(
      returnUrl,
    )
  ) {
    throw new BadRequestException(
      'ICICI payment return URL is not configured',
    );
  }

  return this.service
    .initiateIciciTradingTestPayment(
      Number(
        payload.dealerId,
      ),
      returnUrl,
    );
}

    @Post('payments')
  async createPayment(@Req() req: any, @Body() body: any) {
    const payload = this.getDealerPayload(req);

    return this.service.createDealerPayment(Number(payload.dealerId), body);
  }

    @Post('payment-receipts/upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadPaymentReceipts(
    @Req() req: any,
    @UploadedFiles() files: any[],
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.uploadDealerPaymentReceipts(files, {
      id: Number(payload.dealerId),
      name: payload.dealerName,
      roles: ['DEALER'],
    });
  }

    @Post('complaint-photos/upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadComplaintPhotos(
    @Req() req: any,
    @UploadedFiles() files: any[],
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.uploadDealerComplaintPhotos(files, {
      id: Number(payload.dealerId),
      name: payload.dealerName,
      roles: ['DEALER'],
    });
  }

  @Post('complaints')
  async createComplaint(@Req() req: any, @Body() body: any) {
    const payload = this.getDealerPayload(req);

    return this.service.createDealerComplaint(
      Number(payload.dealerId),
      body,
      {
        id: Number(payload.dealerId),
        name: payload.dealerName,
        roles: ['DEALER'],
      },
    );
  }

  @Get('complaints')
  async listComplaints(@Req() req: any, @Query() query: any) {
    const payload = this.getDealerPayload(req);

    return this.service.listDealerComplaints(Number(payload.dealerId), query);
  }

    @Post('orders/:id/comments')
  async createOrderComment(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.createDealerOrderComment(
      Number(payload.dealerId),
      id,
      body,
      {
        id: Number(payload.dealerId),
        name: payload.dealerName,
        roles: ['DEALER'],
      },
    );
  }

  @Get('orders/:id/comments')
  async listOrderComments(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.listDealerOrderComments(Number(payload.dealerId), id);
  }

    @Get('notifications')
  async listNotifications(@Req() req: any, @Query() query: any) {
    const payload = this.getDealerPayload(req);

    return this.service.listDealerNotifications(
      Number(payload.dealerId),
      query,
    );
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.markDealerNotificationRead(
      Number(payload.dealerId),
      id,
    );
  }

    @Post('monthly-requirements')
  async createMonthlyRequirement(@Req() req: any, @Body() body: any) {
    const payload = this.getDealerPayload(req);

    return this.service.createMonthlyRequirement(
      Number(payload.dealerId),
      body,
      {
        id: Number(payload.dealerId),
        name: payload.dealerName,
        roles: ['DEALER'],
      },
    );
  }

  @Get('monthly-requirements')
  async listMonthlyRequirements(@Req() req: any, @Query() query: any) {
    const payload = this.getDealerPayload(req);

    return this.service.listMonthlyRequirements(
      Number(payload.dealerId),
      query,
    );
  }

    @Get('proforma-invoice/:id/pdf')
  async dealerProformaInvoicePdf(
    @Req() req: any,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.generateDealerProformaInvoicePdf(
      Number(payload.dealerId),
      id,
      res,
    );
  }

  @Get('final-invoice/:id/pdf')
  async dealerFinalInvoicePdf(
    @Req() req: any,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.generateDealerFinalInvoicePdf(
      Number(payload.dealerId),
      id,
      res,
    );
  }

    @Get('orders/:id/invoices')
  async dealerOrderInvoices(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerOrderInvoicesForPortal(
      Number(payload.dealerId),
      id,
    );
  }

  @Get('insurance/plans')
async insurancePlans(
  @Req() req: any,
) {
  this.getDealerPayload(
    req,
  );

  return this.service
    .listDealerInsurancePlans();
}

@Post('insurance/requests')
async createInsuranceRequest(
  @Req() req: any,
  @Body() body: any,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  return this.service
    .createDealerInsuranceRequest(
      Number(
        payload.dealerId,
      ),
      body,
    );
}

@Post(
  'insurance/requests/:id/payment/launch',
)
async createDealerInsurancePaymentLaunch(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @Body()
  body: any,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  const dealerId =
    Number(
      payload.dealerId,
    );

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
   * Ownership validation.
   */
  await this.service
    .getDealerInsuranceRequestDetail(
      dealerId,
      Number(id),
    );

  const token =
    await this.paymentLaunchService
      .createDealerLaunchToken({
        purpose:
          IciciPaymentLaunchPurpose
            .DEALER_INSURANCE,

        referenceId:
          Number(id),

        dealerId,

        paymentSource,
      });

  const websiteBaseUrl =
    String(
      process.env
        .ICICI_PAYMENT_LAUNCH_BASE_URL ||
        '',
    )
      .trim()
      .replace(
        /\/+$/,
        '',
      );

  if (
    websiteBaseUrl !==
    'https://adityasolars.co.in'
  ) {
    throw new BadRequestException(
      'Payment launch website is not configured',
    );
  }

  return {
    success: true,

    launchUrl:
      `${websiteBaseUrl}/payment/launch#token=${encodeURIComponent(
        token,
      )}`,
  };
}

@Post(
  'insurance/requests/:id/payment/initiate',
)
async initiateInsurancePayment(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  const returnUrl =
    String(
      process.env
        .ICICI_PAYMENT_RETURN_URL ||
        '',
    ).trim();

  if (
    !returnUrl ||
    !/^https:\/\//i.test(
      returnUrl,
    )
  ) {
    throw new BadRequestException(
      'ICICI payment return URL is not configured',
    );
  }

  return this.service
    .initiateDealerInsurancePayment(
      Number(
        payload.dealerId,
      ),
      Number(
        id,
      ),
      returnUrl,
    );
}

@Get('insurance/requests')
async insuranceRequests(
  @Req() req: any,
  @Query() query: any,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  return this.service
    .listDealerInsuranceRequests(
      Number(
        payload.dealerId,
      ),
      query,
    );
}

@Get(
  'insurance/policies',
)
listDealerInsurancePolicies(
  @Req()
  req: any,

  @Query()
  query: any,
) {
  const dealerId =
    this.getDealerPayload(
      req,
    ).dealerId;

  return this
    .service
    .listDealerInsurancePolicies(
      Number(
        dealerId,
      ),
      query,
    );
}

@Get(
  'insurance/policies/:id/documents',
)
getDealerInsurancePolicyDocuments(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  const dealerId =
    this.getDealerPayload(
      req,
    ).dealerId;

  return this
    .service
    .getDealerInsurancePolicyDocuments(
      Number(
        dealerId,
      ),
      Number(
        id,
      ),
    );
}

@Get('insurance/requests/:id')
async insuranceRequestDetail(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  return this.service
    .getDealerInsuranceRequestDetail(
      Number(
        payload.dealerId,
      ),
      id,
    );
}

@Post(
  'insurance/requests/:id/documents/upload',
)
@UseInterceptors(
  FileInterceptor(
    'file',
    {
      limits: {
        fileSize:
          8 *
          1024 *
          1024,
      },
    },
  ),
)
async uploadInsuranceRequestDocument(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @UploadedFile()
  file: any,

  @Body()
  body: any,
) {
  const payload =
    this.getDealerPayload(
      req,
    );

  return this.service
    .uploadDealerInsuranceRequestDocument(
      Number(
        payload.dealerId,
      ),
      id,
      file,
      body,
      {
        id:
          Number(
            payload.dealerId,
          ),

        name:
          payload.dealerName ||
          '',

        roles: [
          'DEALER',
        ],
      },
    );
}

@Post('device-token')
async registerDealerDeviceToken(
  @Req() req: any,
  @Body() body: any,
) {
  const payload =
    this.getDealerPayload(req);

  return this.service.registerDealerDeviceToken(
    Number(payload.dealerId),
    body,
  );
}

  private getDealerPayload(req: any) {
    const authHeader = req.headers?.authorization || '';
const headerToken = authHeader.replace('Bearer ', '');
const queryToken = req.query?.token || '';
const token = headerToken || queryToken;

    if (!token) {
      throw new UnauthorizedException('Dealer token missing');
    }

    const payload: any = jwt.verify(token, 'mysecretkey');

    if (!payload?.dealerId) {
      throw new UnauthorizedException('Invalid dealer token');
    }

    return payload;
  }
}