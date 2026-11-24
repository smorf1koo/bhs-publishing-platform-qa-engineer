// Пример e2e-теста. Остальные тесты основного сценария пишете вы.
import { test, expect } from "@playwright/test";
import { makeZip, validDemoEntries } from "./helpers/zip.mjs";

test("корректный архив проходит проверку и уходит на модерацию", async ({ page }) => {
  await page.goto("/#/upload");

  await page.getByTestId("upload-project").selectOption({ label: "Орбитальный курьер" });
  await page.getByTestId("upload-file").setInputFiles({
    name: "orbit-courier-web.zip",
    mimeType: "application/zip",
    buffer: makeZip(validDemoEntries()),
  });

  await expect(page.getByTestId("upload-check")).toContainText("Архив прошёл проверку");
  await page.getByTestId("upload-submit").click();
  await expect(page.getByTestId("upload-success")).toContainText("отправлена на модерацию");

  await page.getByRole("link", { name: "Модерация" }).click();
  await expect(page.getByTestId("queue-item").filter({ hasText: "orbit-courier-web.zip" }))
    .toHaveCount(1);
});
