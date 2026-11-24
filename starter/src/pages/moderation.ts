import { loadDecisions, loadQueue, saveDecision } from "../store";
import type { ModerationItem, ModerationKind } from "../types";
import { esc, formatDate } from "../lib/format";

const KIND: Record<ModerationKind, string> = {
  publication: "Публикация карточки",
  card_edit: "Правка карточки",
  demo: "Демоверсия",
};

function itemHtml(i: ModerationItem): string {
  return `
    <li class="panel queue-item" data-testid="queue-item" data-id="${esc(i.id)}">
      <p><strong>${KIND[i.kind]}</strong> · ${esc(i.project_title)} · ${esc(i.author)}
        <span class="muted small">· ${esc(i.id)} · от ${formatDate(i.submitted_at)}</span></p>
      <p>${esc(i.summary)}</p>
      <div class="actions">
        <button type="button" data-action="approve">Одобрить</button>
        <textarea rows="2" placeholder="Причина отклонения (обязательно)"
                  data-testid="reject-reason"></textarea>
        <button type="button" data-action="reject" class="danger">Отклонить</button>
      </div>
      <p class="error small" data-testid="reject-error" hidden></p>
    </li>`;
}

export async function renderModeration(root: HTMLElement): Promise<void> {
  root.innerHTML = '<p class="muted" data-testid="loading">Загрузка очереди…</p>';
  let queue: ModerationItem[];
  try {
    queue = await loadQueue();
  } catch {
    root.innerHTML = '<p class="error">Не удалось загрузить очередь модерации.</p>';
    return;
  }
  const decisions = loadDecisions();

  root.innerHTML = `
    <h1>Очередь модерации</h1>
    <p data-testid="queue-count">В очереди: ${queue.length}</p>
    ${
      queue.length
        ? `<ul class="queue" data-testid="queue">${queue.map(itemHtml).join("")}</ul>`
        : '<p class="empty" data-testid="queue-empty">Очередь пуста.</p>'
    }
    <h2>Решения в этой сессии</h2>
    <ul data-testid="decisions">
      ${
        decisions.length
          ? decisions
              .map(
                (d) => `<li data-testid="decision">${esc(d.id)}: ${
                  d.decision === "approved" ? "одобрено" : `отклонено — «${esc(d.reason ?? "")}»`
                }</li>`,
              )
              .join("")
          : '<li class="muted">Пока нет.</li>'
      }
    </ul>`;

  root.querySelectorAll<HTMLLIElement>('[data-testid="queue-item"]').forEach((li) => {
    const id = li.dataset.id!;
    const reasonEl = li.querySelector<HTMLTextAreaElement>("textarea")!;
    const errorEl = li.querySelector<HTMLParagraphElement>('[data-testid="reject-error"]')!;
    li.querySelector('[data-action="approve"]')!.addEventListener("click", () => {
      saveDecision({ id, decision: "approved", decided_at: new Date().toISOString() });
      void renderModeration(root);
    });
    li.querySelector('[data-action="reject"]')!.addEventListener("click", () => {
      const reason = reasonEl.value;
      if (reason.length === 0) {
        errorEl.hidden = false;
        errorEl.textContent = "Укажите причину отклонения: автор увидит её в уведомлении.";
        return;
      }
      saveDecision({ id, decision: "rejected", reason, decided_at: new Date().toISOString() });
      void renderModeration(root);
    });
  });
}
