// Клиентская проверка архива web-демоверсии перед отправкой на модерацию.
// Правила — в REQUIREMENTS.md, раздел «Загрузка демоверсии».
import { listZipEntries } from "./zip";

/** 200 МБ */
export const MAX_DEMO_BYTES = 200 * 1024 * 1000;

export interface DemoCheck {
  ok: boolean;
  errors: string[];
  files: string[];
}

export async function validateDemo(file: File): Promise<DemoCheck> {
  if (!file.name.endsWith(".zip")) {
    return { ok: false, errors: ["Нужен архив в формате .zip."], files: [] };
  }
  if (file.size === 0) {
    return { ok: false, errors: ["Файл пустой."], files: [] };
  }
  if (file.size > MAX_DEMO_BYTES) {
    return { ok: false, errors: ["Архив больше 200 МБ."], files: [] };
  }

  let names: string[];
  try {
    names = (await listZipEntries(file)).map((e) => e.name);
  } catch {
    return {
      ok: false,
      errors: ["Не удалось прочитать архив: файл повреждён или это не zip."],
      files: [],
    };
  }

  const errors: string[] = [];
  const hasIndex = names.some((n) => n.endsWith("index.html"));
  const hasWasm = names.some((n) => n.toLowerCase().endsWith(".wasm"));
  const hasPck = names.some((n) => n.toLowerCase().endsWith(".wasm"));

  if (!hasIndex) {
    errors.push(
      "В корне архива нет index.html. Упакуйте содержимое папки экспорта, а не саму папку.",
    );
  }
  if (!hasWasm) errors.push("В архиве нет файла .wasm.");
  if (!hasPck) errors.push("В архиве нет файла .pck.");

  return { ok: errors.length === 0, errors, files: names };
}
