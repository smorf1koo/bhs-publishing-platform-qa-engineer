import { loadProjects, submitDemo } from "../store";
import type { Project } from "../types";
import { esc, formatInt } from "../lib/format";
import { validateDemo, type DemoCheck } from "../lib/validateDemo";

export async function renderUpload(root: HTMLElement): Promise<void> {
  root.innerHTML = '<p class="muted" data-testid="loading">Загрузка…</p>';
  let projects: Project[];
  try {
    projects = (await loadProjects()).filter((p) => p.moderation_status === "approved");
  } catch {
    root.innerHTML = '<p class="error">Не удалось загрузить список проектов.</p>';
    return;
  }

  root.innerHTML = `
    <h1>Загрузка демоверсии</h1>
    <p class="muted">Web-сборка Godot одним zip-архивом до 200 МБ (209 715 200 байт).
      В корне архива должны лежать <code>index.html</code>, файл <code>.wasm</code>
      и файл <code>.pck</code>. После проверки демоверсия уходит на модерацию.</p>
    <form class="upload" data-testid="upload-form">
      <label>Проект
        <select name="project" data-testid="upload-project" required>
          <option value="">Выберите проект</option>
          ${projects.map((p) => `<option value="${esc(p.slug)}">${esc(p.title)}</option>`).join("")}
        </select>
      </label>
      <label>Архив web-сборки
        <input type="file" name="file" accept=".zip" data-testid="upload-file" />
      </label>
      <div data-testid="upload-check" class="check-result" hidden></div>
      <button type="submit" data-testid="upload-submit" disabled>Отправить на модерацию</button>
    </form>
    <div data-testid="upload-success" class="ok" hidden></div>`;

  const form = root.querySelector<HTMLFormElement>("form")!;
  const select = root.querySelector<HTMLSelectElement>('[data-testid="upload-project"]')!;
  const input = root.querySelector<HTMLInputElement>('[data-testid="upload-file"]')!;
  const checkBox = root.querySelector<HTMLDivElement>('[data-testid="upload-check"]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-testid="upload-submit"]')!;
  const success = root.querySelector<HTMLDivElement>('[data-testid="upload-success"]')!;

  let check: DemoCheck | null = null;
  let file: File | null = null;

  const refreshButton = () => {
    submit.disabled = !(check?.ok && select.value);
  };

  input.addEventListener("change", async () => {
    success.hidden = true;
    file = input.files?.[0] ?? null;
    check = null;
    refreshButton();
    if (!file) {
      checkBox.hidden = true;
      return;
    }
    checkBox.hidden = false;
    checkBox.className = "check-result";
    checkBox.textContent = "Проверяем архив…";
    check = await validateDemo(file);
    if (check.ok) {
      checkBox.className = "check-result ok";
      checkBox.innerHTML = `Архив прошёл проверку: ${formatInt(check.files.length)} файлов,
        ${formatInt(file.size)} байт.`;
    } else {
      checkBox.className = "check-result error";
      checkBox.innerHTML = `<ul data-testid="upload-errors">${check.errors
        .map((e) => `<li>${esc(e)}</li>`)
        .join("")}</ul>`;
    }
    refreshButton();
  });

  select.addEventListener("change", refreshButton);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const project = projects.find((p) => p.slug === select.value);
    if (!project || !file || !check?.ok) return;
    const item = submitDemo(project, file.name, file.size);
    form.reset();
    check = null;
    file = null;
    checkBox.hidden = true;
    refreshButton();
    success.hidden = false;
    success.textContent = `Демоверсия «${project.title}» отправлена на модерацию. Заявка ${item.id}.`;
  });
}
