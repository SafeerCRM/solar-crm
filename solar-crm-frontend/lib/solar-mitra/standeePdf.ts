
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
  '/solar-mitra-assets/fonts/NotoSansDevanagari-ExtraBold.ttf';

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
  BOX_Y + 120;

page.drawImage(qrImage, {
  x: qrX,
  y: qrY,
  width: qrSize,
  height: qrSize,
});

const heading = 'सोलर मित्र :';
const shopName = mitra.name.trim();

const maxTextWidth = BOX_WIDTH - 30;

const wrapShopName = (
  size: number,
): string[] => {
  const words = shopName
    .split(/\s+/)
    .filter(Boolean);

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine
      ? `${currentLine} ${word}`
      : word;

    if (
      hindiFont.widthOfTextAtSize(
        candidate,
        size,
      ) <= maxTextWidth
    ) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }

      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

// Keep the heading on its own line.
// Allow up to two additional lines for the shop name.
let fontSize = 40;
let shopLines: string[] = [];
let labelLines: string[] = [];

const labelBottomY = BOX_Y + 24;
const qrClearance = 12;

const fitsLabel = (size: number): boolean => {
  shopLines = wrapShopName(size);
  labelLines = [heading, ...shopLines];

  if (
    !shopName ||
    shopLines.length > 2 ||
    shopLines.length === 0
  ) {
    return false;
  }

  const widthFits = labelLines.every(
    (line) =>
      hindiFont.widthOfTextAtSize(
        line,
        size,
      ) <= maxTextWidth,
  );

  const lineHeight = size * 1.15;

  const labelTopY =
    labelBottomY +
    (labelLines.length - 1) * lineHeight +
    size;

  const heightFits =
    labelTopY <= qrY - qrClearance;

  return widthFits && heightFits;
};

while (
  fontSize > 12 &&
  !fitsLabel(fontSize)
) {
  fontSize--;
}

if (!fitsLabel(fontSize)) {
  throw new Error(
    `Solar Mitra #${mitra.id} name cannot fit safely below the QR`,
  );
}

const lineHeight = fontSize * 1.15;

labelLines.forEach((line, index) => {
  const textWidth =
    hindiFont.widthOfTextAtSize(
      line,
      fontSize,
    );

  const y =
    labelBottomY +
    (labelLines.length - 1 - index) *
      lineHeight;

  page.drawText(line, {
    x:
      BOX_X +
      (BOX_WIDTH - textWidth) / 2,
    y,
    size: fontSize,
    font: hindiFont,
    color: rgb(0, 0, 0),
  });
});
  }

  return output.save();
}
