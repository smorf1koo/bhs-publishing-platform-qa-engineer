// Мини-генератор zip-архивов для тестов (без сжатия, только стандартная
// библиотека Node.js). Позволяет собирать архивы прямо в тесте и не хранить
// бинарные файлы в репозитории.
//
//   import { makeZip } from "./helpers/zip.mjs";
//   const buf = makeZip([
//     { name: "index.html", data: "<html></html>" },
//     { name: "game.wasm", data: Buffer.alloc(1024) },
//   ]);
//   await page.getByTestId("upload-file").setInputFiles({
//     name: "demo.zip", mimeType: "application/zip", buffer: buf,
//   });

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Собирает zip-архив (метод «stored», без сжатия).
 * Имя с «/» на конце — папка; вложенные пути пишутся как «game/index.html».
 * @param {{ name: string, data?: Buffer | string }[]} entries
 * @returns {Buffer}
 */
export function makeZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8");
    const data = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data ?? "", "utf8");
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += 30 + name.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

/** Минимальный корректный набор файлов web-сборки Godot. */
export function validDemoEntries() {
  return [
    { name: "index.html", data: "<!doctype html><title>demo</title>" },
    { name: "index.js", data: "// engine loader" },
    { name: "index.wasm", data: Buffer.alloc(2048) },
    { name: "index.pck", data: Buffer.alloc(1024) },
  ];
}
