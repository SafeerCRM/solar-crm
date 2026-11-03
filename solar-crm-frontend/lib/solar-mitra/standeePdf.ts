
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

export type SolarMitraPrintFormat =
  | 'POSTER_QR_INSERT'
  | 'SMALL_STANDEE';

const TEMPLATE_PATH =
  '/solar-mitra-assets/qr-standee-template.pdf';

const FONT_PATH =
  '/solar-mitra-assets/fonts/NotoSansDevanagari-ExtraBold.ttf';

const INCH = 72;

const POSTER_WIDTH = 11 * INCH;
const POSTER_HEIGHT = 17 * INCH;

const STANDEE_WIDTH = 4 * INCH;
const STANDEE_HEIGHT = 6 * INCH;

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
  format: SolarMitraPrintFormat = 'POSTER_QR_INSERT',
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

      if (!mitra.name?.trim()) {
    throw new Error(
      `Business / Shop Name is missing for Solar Mitra #${mitra.id}. Please edit the Solar Mitra and enter the shop name before generating the standee.`,
    );
  }

    const isQrInsert =
  format === 'POSTER_QR_INSERT';

const page = output.addPage(
  isQrInsert
    ? [POSTER_WIDTH, POSTER_HEIGHT]
    : [STANDEE_WIDTH, STANDEE_HEIGHT],
);

const standeeScale = Math.min(
  STANDEE_WIDTH / templatePage.width,
  STANDEE_HEIGHT / templatePage.height,
);

const standeeArtworkWidth =
  templatePage.width * standeeScale;

const standeeArtworkHeight =
  templatePage.height * standeeScale;

const standeeArtworkX =
  (STANDEE_WIDTH - standeeArtworkWidth) / 2;

const standeeArtworkY =
  (STANDEE_HEIGHT - standeeArtworkHeight) / 2;

const contentWidth = isQrInsert
  ? BOX_WIDTH
  : BOX_WIDTH * standeeScale;

const contentHeight = isQrInsert
  ? BOX_HEIGHT
  : BOX_HEIGHT * standeeScale;

const contentX = isQrInsert
  ? BOX_X
  : standeeArtworkX +
    (STANDEE_WIDTH - 2 * standeeArtworkX -
      contentWidth) / 2;

const contentY = isQrInsert
  ? BOX_Y
  : standeeArtworkY +
    (POSTER_HEIGHT - 5 * INCH - BOX_HEIGHT) *
      standeeScale;

  if (!isQrInsert) {
    // Fit the original artwork proportionally
// inside the 4 x 6 inch standee.
const artworkScale = Math.min(
  STANDEE_WIDTH / templatePage.width,
  STANDEE_HEIGHT / templatePage.height,
);

const artworkWidth =
  templatePage.width * artworkScale;

const artworkHeight =
  templatePage.height * artworkScale;

const artworkX =
  (STANDEE_WIDTH - artworkWidth) / 2;

const artworkY =
  (STANDEE_HEIGHT - artworkHeight) / 2;

// White background for any tiny side margins.
page.drawRectangle({
  x: 0,
  y: 0,
  width: STANDEE_WIDTH,
  height: STANDEE_HEIGHT,
  color: rgb(1, 1, 1),
});

page.drawPage(templatePage, {
  x: artworkX,
  y: artworkY,
  width: artworkWidth,
  height: artworkHeight,
});

    // Cover the reference QR/name panel.
    // This area is based on the supplied template preview.
    const originalPanel = {
  x:
    standeeArtworkX +
    (135 / 778) *
      POSTER_WIDTH *
      standeeScale,

  y:
    standeeArtworkY +
    (POSTER_HEIGHT -
      (821 / 1200) * POSTER_HEIGHT) *
      standeeScale,

  width:
    ((642 - 135) / 778) *
    POSTER_WIDTH *
    standeeScale,

  height:
    ((821 - 293) / 1200) *
    POSTER_HEIGHT *
    standeeScale,
};

    page.drawRectangle({
      x: originalPanel.x,
      y: originalPanel.y,
      width: originalPanel.width,
      height: originalPanel.height,
      color: rgb(1, 1, 1),
    });
    }

    // Exact 6 x 6.5 inch QR/name box.
    page.drawRectangle({
  x: contentX,
  y: contentY,
  width: contentWidth,
  height: contentHeight,
  color: rgb(1, 1, 1),
  ...(isQrInsert
    ? {
        borderColor: rgb(0.35, 0.35, 0.35),
        borderWidth: 0.75,
      }
    : {}),
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
const qrSize = isQrInsert
  ? 4.6 * INCH
  : 4.6 * INCH * standeeScale;

const qrX =
  contentX + (contentWidth - qrSize) / 2;

const qrY =
  contentY +
  (isQrInsert ? 120 : 120 * standeeScale);

page.drawImage(qrImage, {
  x: qrX,
  y: qrY,
  width: qrSize,
  height: qrSize,
});

const heading = 'सोलर मित्र :';
const shopName = mitra.name.trim();

const maxTextWidth = isQrInsert
  ? BOX_WIDTH - 30
  : contentWidth - 30 * standeeScale;

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
let fontSize = isQrInsert
  ? 40
  : 40 * standeeScale;
let shopLines: string[] = [];
let labelLines: string[] = [];

const labelBottomY =
  contentY +
  (isQrInsert ? 24 : 24 * standeeScale);

const qrClearance = isQrInsert
  ? 12
  : 12 * standeeScale;

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

const minFontSize = isQrInsert
  ? 12
  : 12 * standeeScale;

const fontStep = isQrInsert
  ? 1
  : standeeScale;

while (
  fontSize > minFontSize &&
  !fitsLabel(fontSize)
) {
  fontSize -= fontStep;
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
  contentX +
  (contentWidth - textWidth) / 2,
    y,
    size: fontSize,
    font: hindiFont,
    color: rgb(0, 0, 0),
  });
});
  }

  return output.save();
}
