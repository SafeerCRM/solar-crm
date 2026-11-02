
import 'regenerator-runtime/runtime';

import {
  PDFDocument,
  rgb,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';

export type StandeeMitra = {
  id: number;
  name: string;
  publicReferralToken?: string | null;
};

const TEMPLATE_PATH =
  '/solar-mitra-assets/qr-standee-template.pdf';

const FONT_PATH =
  '/solar-mitra-assets/fonts/NotoSansDevanagari-Bold.ttf';

const INCH = 72;

const POSTER_WIDTH = 11 * INCH;
const POSTER_HEIGHT = 17 * INCH;

const BOX_WIDTH = 6 * INCH;
const BOX_HEIGHT = 6.5 * INCH;

const BOX_X =
  (POSTER_WIDTH - BOX_WIDTH) / 2;

const BOX_Y =
  POSTER_HEIGHT - 5 * INCH - BOX_HEIGHT;

const REFERRAL_BASE_URL =
  'https://solar-crm-frontend.vercel.app/solar-mitra-referral/';

export async function generateSolarMitraStandeePdf(
  mitras: StandeeMitra[],
): Promise<Uint8Array> {
  if (mitras.length === 0) {
    throw new Error(
      'Select at least one Solar Mitra',
    );
  }

  const [templateResponse, fontResponse] =
    await Promise.all([
      fetch(TEMPLATE_PATH),
      fetch(FONT_PATH),
    ]);

  if (
    !templateResponse.ok ||
    !fontResponse.ok
  ) {
    throw new Error(
      'Unable to load standee template or Hindi font',
    );
  }

  const templateBytes =
    await templateResponse.arrayBuffer();

  const fontBytes =
    await fontResponse.arrayBuffer();

  const output =
    await PDFDocument.create();

  output.registerFontkit(fontkit);

  const hindiFont =
    await output.embedFont(fontBytes, {
      subset: true,
    });

  const templatePdf =
    await PDFDocument.load(templateBytes);

  const [templatePage] =
    await output.embedPdf(templatePdf, [0]);

  for (const mitra of mitras) {
    if (!mitra.publicReferralToken) {
      throw new Error(
        `Referral QR is unavailable for Solar Mitra #${mitra.id}`,
      );
    }

    const page = output.addPage([
      POSTER_WIDTH,
      POSTER_HEIGHT,
    ]);

    // Scale original artwork to the exact poster size.
    page.drawPage(templatePage, {
      x: 0,
      y: 0,
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
    });

    // Cover the reference QR/name panel.
    // This area is based on the supplied template preview.
    const originalPanel = {
      x: (135 / 778) * POSTER_WIDTH,
      y:
        POSTER_HEIGHT -
        (821 / 1200) * POSTER_HEIGHT,
      width:
        ((642 - 135) / 778) *
        POSTER_WIDTH,
      height:
        ((821 - 293) / 1200) *
        POSTER_HEIGHT,
    };

    page.drawRectangle({
      x: originalPanel.x,
      y: originalPanel.y,
      width: originalPanel.width,
      height: originalPanel.height,
      color: rgb(1, 1, 1),
    });

    // Exact 6 x 6.5 inch QR/name box.
    page.drawRectangle({
      x: BOX_X,
      y: BOX_Y,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.35, 0.35, 0.35),
      borderWidth: 0.75,
    });

    const referralUrl =
      REFERRAL_BASE_URL +
      encodeURIComponent(
        mitra.publicReferralToken,
      );

    const qrDataUrl =
      await QRCode.toDataURL(
        referralUrl,
        {
          width: 1400,
          margin: 2,
          errorCorrectionLevel: 'H',
        },
      );

    const qrImage =
      await output.embedPng(qrDataUrl);

    // Keep the QR centered with sufficient
// space for the Solar Mitra name below.
const qrSize = 4.6 * INCH;

const qrX =
  BOX_X + (BOX_WIDTH - qrSize) / 2;

const qrY =
  BOX_Y + 90;

page.drawImage(qrImage, {
  x: qrX,
  y: qrY,
  width: qrSize,
  height: qrSize,
});

 const label =
  `सोलर मित्र : ${mitra.name}`;

let fontSize = 30;

while (
  fontSize > 12 &&
  hindiFont.widthOfTextAtSize(
    label,
    fontSize,
  ) >
    BOX_WIDTH - 36
) {
  fontSize--;
}

    const textWidth =
      hindiFont.widthOfTextAtSize(
        label,
        fontSize,
      );

    page.drawText(label, {
      x:
        BOX_X +
        (BOX_WIDTH - textWidth) / 2,
      y: BOX_Y + 35,
      size: fontSize,
      font: hindiFont,
      color: rgb(0, 0, 0),
    });
  }

  return output.save();
}
