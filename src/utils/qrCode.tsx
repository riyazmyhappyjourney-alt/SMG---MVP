import React from 'react';

/**
 * Pure TypeScript QR Code generator for URLs and text.
 * Generates an exact Model 2 QR Code matrix without any external dependencies.
 */

const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);
let val = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = val;
  LOG[val] = i;
  val = (val << 1) ^ (val & 128 ? 285 : 0);
}
EXP[255] = EXP[0];

function gMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[(LOG[a] + LOG[b]) % 255];
}

function rsCompute(data: Uint8Array, ecCount: number): Uint8Array {
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gMul(gen[j], EXP[i]);
      next[j + 1] ^= gen[j];
    }
    gen = next;
  }

  const res = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    for (let j = 0; j < ecCount - 1; j++) {
      res[j] = res[j + 1] ^ gMul(gen[j + 1], factor);
    }
    res[ecCount - 1] = gMul(gen[ecCount], factor);
  }
  return res;
}

const VERSIONS = [
  { ver: 1, size: 21, totalCW: 26, ecCW: 10, dataCW: 16, align: [] },
  { ver: 2, size: 25, totalCW: 44, ecCW: 16, dataCW: 28, align: [6, 18] },
  { ver: 3, size: 29, totalCW: 70, ecCW: 26, dataCW: 44, align: [6, 22] },
  { ver: 4, size: 33, totalCW: 100, ecCW: 36, dataCW: 64, align: [6, 26] },
  { ver: 5, size: 37, totalCW: 134, ecCW: 48, dataCW: 86, align: [6, 30] },
  { ver: 6, size: 41, totalCW: 172, ecCW: 64, dataCW: 108, align: [6, 34] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  const v = VERSIONS.find((ver) => ver.dataCW >= utf8.length + 3) || VERSIONS[VERSIONS.length - 1];

  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  // Byte mode
  pushBits(0b0100, 4);
  pushBits(utf8.length, 8);
  for (const b of utf8) pushBits(b, 8);

  const maxBits = v.dataCW * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const pads = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(pads[padIdx % 2], 8);
    padIdx++;
  }

  const dataBytes = new Uint8Array(v.dataCW);
  for (let i = 0; i < v.dataCW; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) byteVal = (byteVal << 1) | bits[i * 8 + b];
    dataBytes[i] = byteVal;
  }

  const ecBytes = rsCompute(dataBytes, v.ecCW);
  const allCW = new Uint8Array(v.totalCW);
  allCW.set(dataBytes, 0);
  allCW.set(ecBytes, dataBytes.length);

  const N = v.size;
  const matrix: (boolean | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
  const isFunction: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const setFunc = (r: number, c: number, val: boolean) => {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  };

  const drawFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = top + r;
        const tc = left + c;
        if (tr >= 0 && tr < N && tc >= 0 && tc < N) {
          const isDark =
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setFunc(tr, tc, isDark);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, N - 7);
  drawFinder(N - 7, 0);

  for (let i = 8; i < N - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  if (v.align.length >= 2) {
    const r = v.align[1];
    const c = v.align[1];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const isDark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
        setFunc(r + dr, c + dc, isDark);
      }
    }
  }

  setFunc(4 * v.ver + 9, 8, true);

  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunc(8, i, false);
    if (!isFunction[i][8]) setFunc(i, 8, false);
  }
  for (let i = N - 8; i < N; i++) {
    if (!isFunction[8][i]) setFunc(8, i, false);
    if (!isFunction[i][8]) setFunc(i, 8, false);
  }

  let bitIndex = 0;
  const allBits: number[] = [];
  for (const b of allCW) {
    for (let i = 7; i >= 0; i--) allBits.push((b >> i) & 1);
  }

  let upward = true;
  for (let col = N - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let r = 0; r < N; r++) {
      const row = upward ? N - 1 - r : r;
      for (let c = col; c >= col - 1; c--) {
        if (!isFunction[row][c]) {
          const bit = bitIndex < allBits.length ? allBits[bitIndex++] : 0;
          const mask = (row + c) % 2 === 0;
          matrix[row][c] = (bit ^ (mask ? 1 : 0)) === 1;
        }
      }
    }
    upward = !upward;
  }

  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  for (let i = 0; i < 8; i++) matrix[N - 1 - i][8] = formatBits[i] === 1;
  for (let i = 8; i < 15; i++) matrix[8][N - 15 + i] = formatBits[i] === 1;

  return matrix.map((row) => row.map((cell) => Boolean(cell)));
}

interface QrCodeSvgProps {
  value: string;
  size?: number | string;
  fgColor?: string;
  bgColor?: string;
  quietZone?: number;
  className?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 128,
  fgColor = '#172033',
  bgColor = '#FFFFFF',
  quietZone = 3,
  className = '',
}) => {
  const matrix = React.useMemo(() => generateQrMatrix(value), [value]);
  const matrixSize = matrix.length;
  const viewBoxSize = matrixSize + quietZone * 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR Code link to verified property details"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c + quietZone}
              y={r + quietZone}
              width={1}
              height={1}
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};
