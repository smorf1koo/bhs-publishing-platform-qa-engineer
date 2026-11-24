import { loadProjects } from "../store";
import type { Project } from "../types";
import { esc, formatDate } from "../lib/format";

interface Filters {
  q: string;
  genre: string;
  onlyDemo: boolean;
  sort: "new" | "title";
}

const filters: Filters = { q: "", genre: "", onlyDemo: false, sort: "new" };

const DEMO_BADGE: Record<Project["demo"]["status"], string> = {
  ready: '<span class="badge badge-ok">Играбельное демо</span>',
  moderation: '<span class="badge badge-wait">Демо на модерации</span>',
  none: "",
};

const isVisible = (p: Project) => p.moderation_status !== "pending";

function applyFilters(all: Project[]): { matched: Project[]; shown: Project[] } {
  const visible = all.filter(isVisible);
  const q = filters.q.trim().toLowerCase();
  let matched = visible.filter((p) => (q ? p.title.includes(q) : true));
  if (filters.genre) matched = matched.filter((p) => p.genre === filters.genre);
  let shown = filters.onlyDemo ? matched.filter((p) => p.demo.status === "ready") : matched;
  shown = [...shown].sort((a, b) =>
    filters.sort === "title"
      ? a.title.localeCompare(b.title, "ru")
      : (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  );
  return { matched, shown };
}

function itemHtml(p: Project): string {
  return `
    <li class="card" data-testid="catalog-item">
      <a href="#/projects/${esc(p.slug)}" class="card-link">
        <div class="cover" style="background:${esc(p.cover_color)}"></div>
        <div class="card-body">
          <h3 data-testid="catalog-item-title">${esc(p.title)}</h3>
          <p class="muted">${esc(p.genre)} · ${esc(p.author)}</p>
          <p>${esc(p.teaser)}</p>
          <p class="muted small">Опубликован ${p.published_at ? formatDate(p.published_at) : "—"}</p>
          ${DEMO_BADGE[p.demo.status]}
        </div>
      </a>
    </li>`;
}

export async function renderCatalog(root: HTMLElement): Promise<void> {
  root.innerHTML = '<p class="muted" data-testid="loading">Загрузка каталога…</p>';
  let all: Project[];
  try {
    all = await loadProjects();
  } catch {
    root.innerHTML = '<p class="error">Не удалось загрузить каталог.</p>';
    return;
  }
  const genres = [...new Set(all.filter(isVisible).map((p) => p.genre))].sort((a, b) => a.localeCompare(b, "ru"));

  root.innerHTML = `
    <h1>Каталог проектов</h1>
    <form class="filters" data-testid="catalog-filters" onsubmit="return false">
      <label>Поиск по названию
        <input type="search" name="q" data-testid="catalog-search" value="${esc(filters.q)}"
               placeholder="Например, курьер" />
      </label>
      <label>Жанр
        <select name="genre" data-testid="catalog-genre">
          <option value="">Все жанры</option>
          ${genres.map((g) => `<option ${g === filters.genre ? "selected" : ""}>${esc(g)}</option>`).join("")}
        </select>
      </label>
      <label>Сортировка
        <select name="sort" data-testid="catalog-sort">
          <option value="new" ${filters.sort === "new" ? "selected" : ""}>Сначала новые</option>
          <option value="title" ${filters.sort === "title" ? "selected" : ""}>По названию</option>
        </select>
      </label>
      <label class="check">
        <input type="checkbox" name="onlyDemo" data-testid="catalog-only-demo"
               ${filters.onlyDemo ? "checked" : ""} />
        Только с играбельным демо
      </label>
    </form>
    <p data-testid="catalog-count"></p>
    <ul class="grid" data-testid="catalog-list"></ul>`;

  const form = root.querySelector<HTMLFormElement>("form")!;
  const list = root.querySelector<HTMLUListElement>('[data-testid="catalog-list"]')!;
  const count = root.querySelector<HTMLParagraphElement>('[data-testid="catalog-count"]')!;

  const update = () => {
    const { matched, shown } = applyFilters(all);
    count.textContent = `Найдено: ${matched.length}`;
    list.innerHTML = shown.length
      ? shown.map(itemHtml).join("")
      : '<li class="empty" data-testid="catalog-empty">Ничего не найдено. Измените запрос или сбросьте фильтры.</li>';
  };

  form.addEventListener("input", () => {
    const data = new FormData(form);
    filters.q = String(data.get("q") ?? "");
    filters.genre = String(data.get("genre") ?? "");
    filters.sort = data.get("sort") === "title" ? "title" : "new";
    filters.onlyDemo = data.get("onlyDemo") === "on";
    update();
  });
  update();
}
