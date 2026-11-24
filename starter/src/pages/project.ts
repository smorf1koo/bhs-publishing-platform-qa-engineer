import { loadProject } from "../store";
import type { Project } from "../types";
import { esc, formatDate, formatInt, formatMb, formatPercent, formatUsd } from "../lib/format";

function nicheHtml(p: Project): string {
  const n = p.niche;
  return `
    <section class="panel" data-testid="niche">
      <h2>Ниша: ${esc(n.tag)}</h2>
      <dl class="stats">
        <div><dt>Игр в нише</dt><dd data-testid="niche-games">${formatInt(n.games_count)}</dd></div>
        <div><dt>Медианная цена</dt><dd data-testid="niche-price">${formatUsd(n.median_price_usd)}</dd></div>
        <div><dt>Медиана отзывов</dt><dd data-testid="niche-reviews">${formatInt(n.median_reviews)}</dd></div>
        <div><dt>Доля положительных</dt><dd data-testid="niche-positive">${formatPercent(n.positive_share)}</dd></div>
      </dl>
      <p class="muted small" data-testid="niche-method">
        Метод: ${esc(n.method)}. Данные на <span data-testid="niche-date">${formatDate(n.collected_at)}</span>.
      </p>
    </section>`;
}

function pitchHtml(p: Project): string {
  const v = p.pitch.versions[0];
  return `
    <section class="panel" data-testid="pitch">
      <h2>Питч</h2>
      <p class="muted small" data-testid="pitch-version">
        Публичная версия ${v.version} · хэш <code data-testid="pitch-hash">${esc(v.hash)}</code>
        · от <span data-testid="pitch-date">${formatDate(v.created_at)}</span>
      </p>
      <blockquote>${esc(p.pitch.excerpt)}</blockquote>
    </section>`;
}

function demoHtml(p: Project): string {
  const d = p.demo;
  if (d.status === "ready" && d.url) {
    return `
      <section class="panel" data-testid="demo">
        <h2>Демоверсия</h2>
        <p class="muted small">Web-сборка, ${d.size_bytes ? formatMb(d.size_bytes) : "размер неизвестен"},
          загружена ${d.uploaded_at ? formatDate(d.uploaded_at) : "—"}</p>
        <button type="button" data-testid="demo-run">Запустить демо</button>
        <div class="player" data-testid="demo-player" hidden></div>
      </section>`;
  }
  const text =
    d.status === "moderation"
      ? "Демоверсия проходит модерацию и скоро появится."
      : "Автор пока не загрузил демоверсию.";
  return `
    <section class="panel" data-testid="demo">
      <h2>Демоверсия</h2>
      <p data-testid="demo-status">${text}</p>
    </section>`;
}

function privateHtml(p: Project): string {
  return `
    <section class="panel" data-testid="private">
      <h2>Материалы по запросу</h2>
      <p>${p.private_materials.map(esc).join(", ")} — открываются после подтверждения автором.
        Автор видит, кто и когда открывал материалы.</p>
      <button type="button" data-testid="request-access">Запросить доступ</button>
      <p class="ok" data-testid="request-sent" hidden>Запрос отправлен автору.</p>
    </section>`;
}

export async function renderProject(root: HTMLElement, slug: string): Promise<void> {
  root.innerHTML = '<p class="muted" data-testid="loading">Загрузка карточки…</p>';
  let p: Project | undefined;
  try {
    p = await loadProject(slug);
  } catch {
    root.innerHTML = '<p class="error">Не удалось загрузить карточку.</p>';
    return;
  }
  if (!p || p.moderation_status !== "approved") {
    root.innerHTML = `
      <h1 data-testid="not-found">Проект не найден</h1>
      <p><a href="#/">Вернуться в каталог</a></p>`;
    return;
  }

  root.innerHTML = `
    <p><a href="#/" data-testid="back">← Каталог</a></p>
    <article class="project" data-testid="project">
      <header class="project-head">
        <div class="cover cover-big" style="background:${esc(p.cover_color)}"></div>
        <div>
          <h1 data-testid="project-title">${esc(p.title)}</h1>
          <p class="muted">${esc(p.author)} · ${esc(p.genre)} · ${esc(p.stage)}</p>
          <p class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</p>
          <p class="lead" data-testid="project-teaser">${esc(p.teaser)}</p>
        </div>
      </header>
      <section class="panel">
        <h2>Об игре</h2>
        <p data-testid="project-description">${esc(p.description)}</p>
      </section>
      ${demoHtml(p)}
      ${nicheHtml(p)}
      ${pitchHtml(p)}
      ${privateHtml(p)}
    </article>`;

  const run = root.querySelector<HTMLButtonElement>('[data-testid="demo-run"]');
  const player = root.querySelector<HTMLDivElement>('[data-testid="demo-player"]');
  if (run && player && p.demo.url) {
    const url = p.demo.url;
    run.addEventListener("click", () => {
      player.hidden = false;
      player.innerHTML = `<iframe src="${esc(url)}" title="Демоверсия ${esc(p!.title)}"
        sandbox="allow-scripts" data-testid="demo-frame"></iframe>`;
      run.hidden = true;
    });
  }

  const req = root.querySelector<HTMLButtonElement>('[data-testid="request-access"]')!;
  const sent = root.querySelector<HTMLParagraphElement>('[data-testid="request-sent"]')!;
  req.addEventListener("click", () => {
    req.disabled = true;
    sent.hidden = false;
  });
}
