export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO-дата «2026-11-03» → «03.11.2026». */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth())}.${d.getUTCFullYear()}`;
}

export function formatUsd(v: number): string {
  return v === 0 ? "Free" : `$${v.toFixed(2)}`;
}

export function formatPercent(share: number): string {
  return `${(share * 100).toFixed(1).replace(".", ",")} %`;
}

export function formatInt(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} МБ`;
}
