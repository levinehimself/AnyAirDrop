import qrcode from 'qrcode-generator';

export type QrImage = {
  path: string;
  viewBox: string;
};

const QUIET_ZONE = 3;

export function makeQr(text: string): QrImage {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  const size = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!qr.isDark(row, col)) continue;
      let end = col;
      while (end + 1 < size && qr.isDark(row, end + 1)) end++;
      path += `M${col} ${row}h${end - col + 1}v1h-${end - col + 1}z`;
      col = end;
    }
  }

  const span = size + QUIET_ZONE * 2;
  return { path, viewBox: `${-QUIET_ZONE} ${-QUIET_ZONE} ${span} ${span}` };
}
