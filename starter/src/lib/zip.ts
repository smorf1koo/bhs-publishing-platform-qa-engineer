// Чтение оглавления zip-архива (central directory) без распаковки.
// Читаются только последние килобайты файла и само оглавление,
// поэтому даже архив на 200 МБ проверяется быстро.

export interface ZipEntry {
  name: string;
  compressedSize: number;
  size: number;
}

export class ZipError extends Error {}

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;

async function readSlice(file: Blob, start: number, end: number): Promise<DataView> {
  const buf = await file.slice(start, end).arrayBuffer();
  return new DataView(buf);
}

export async function listZipEntries(file: Blob): Promise<ZipEntry[]> {
  if (file.size < 22) throw new ZipError("too small");
  const tailStart = Math.max(0, file.size - (22 + 0xffff));
  const tail = await readSlice(file, tailStart, file.size);
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError("no end of central directory");
  const count = tail.getUint16(eocd + 10, true);
  const cdSize = tail.getUint32(eocd + 12, true);
  const cdOffset = tail.getUint32(eocd + 16, true);
  if (cdOffset + cdSize > file.size) throw new ZipError("bad central directory");
  const cd = await readSlice(file, cdOffset, cdOffset + cdSize);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];
  let p = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > cd.byteLength || cd.getUint32(p, true) !== CEN_SIG) {
      throw new ZipError("bad entry");
    }
    const compressedSize = cd.getUint32(p + 20, true);
    const size = cd.getUint32(p + 24, true);
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    const nameBytes = new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen);
    entries.push({ name: decoder.decode(nameBytes), compressedSize, size });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}
