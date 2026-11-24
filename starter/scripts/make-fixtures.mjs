// Создаёт в папке fixtures/ архивы для ручной проверки формы загрузки.
// Запуск: npm run fixtures. Папка fixtures/ не коммитится.
// Добавляйте свои варианты в список ниже.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeZip, validDemoEntries } from "../tests/helpers/zip.mjs";

const out = join(process.cwd(), "fixtures");
mkdirSync(out, { recursive: true });

const fixtures = {
  "valid-demo.zip": makeZip(validDemoEntries()),
  "not-a-zip.zip": Buffer.from("это текстовый файл, а не архив"),
};

for (const [name, buf] of Object.entries(fixtures)) {
  writeFileSync(join(out, name), buf);
  console.log(`fixtures/${name}  ${buf.length} байт`);
}
