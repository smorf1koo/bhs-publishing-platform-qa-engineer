# Учебный стенд платформы публикации

Небольшое веб-приложение на Vite и TypeScript без сервера: каталог проектов, карточка проекта, загрузка демоверсии и очередь модерации. Ожидаемое поведение описано в `REQUIREMENTS.md`.

| Путь | Что это |
|---|---|
| `REQUIREMENTS.md` | требования к стенду: по ним вы решаете, баг перед вами или нет |
| `public/data/projects.json`, `public/data/moderation.json` | данные стенда: 8 проектов и 3 заявки в очереди модерации |
| `public/demos/` | заглушки демоверсий, которые открываются в карточке |
| `src/` | код приложения |
| `playwright.config.ts` | настройки Playwright: сам поднимает стенд на http://localhost:5173 |
| `tests/example.spec.ts` | пример e2e-теста |
| `tests/helpers/zip.mjs` | `makeZip()` — собирает zip-архив прямо в тесте, без бинарных файлов в репозитории |
| `scripts/make-fixtures.mjs` | создаёт в `fixtures/` архивы для ручной проверки (`npm run fixtures`) |

## Как запустить

Нужен Node.js 20+.

```bash
npm install
npx playwright install chromium   # один раз, браузер для тестов
npm run dev                       # стенд на http://localhost:5173
npm run test:e2e                  # e2e-тесты (стенд поднимется сам)
npx playwright show-report        # HTML-отчёт о последнем прогоне
```

Состояние сессии хранится в `sessionStorage`: чтобы начать с чистого листа, откройте стенд в новой вкладке. Каждый тест Playwright получает чистый браузерный контекст.

Для файлов больше 50 МБ `setInputFiles` в Playwright принимает только путь к файлу, а не буфер: сначала запишите архив во временный файл, например в `testInfo.outputPath()`.
