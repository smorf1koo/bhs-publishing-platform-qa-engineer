// Данные стенда: JSON из public/data плюс изменения текущей сессии
// (загруженные демо и решения модератора) в sessionStorage.
import type { ModerationDecision, ModerationItem, Project } from "./types";

const KEY_QUEUE = "bhs.extraQueue";
const KEY_DECISIONS = "bhs.decisions";
const KEY_DEMO = "bhs.demoOnModeration";

let projectsCache: Project[] | null = null;
let queueCache: ModerationItem[] | null = null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export async function loadProjects(): Promise<Project[]> {
  if (!projectsCache) {
    const res = await fetch("/data/projects.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    projectsCache = (await res.json()) as Project[];
  }
  const onModeration = readJson<string[]>(KEY_DEMO, []);
  return projectsCache.map((p) =>
    onModeration.includes(p.slug)
      ? { ...p, demo: { ...p.demo, status: "moderation" as const } }
      : p,
  );
}

export async function loadProject(slug: string): Promise<Project | undefined> {
  return (await loadProjects()).find((p) => p.slug === slug);
}

async function baseQueue(): Promise<ModerationItem[]> {
  if (!queueCache) {
    const res = await fetch("/data/moderation.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    queueCache = (await res.json()) as ModerationItem[];
  }
  return queueCache;
}

export async function loadQueue(): Promise<ModerationItem[]> {
  const extra = readJson<ModerationItem[]>(KEY_QUEUE, []);
  const decided = new Set(loadDecisions().map((d) => d.id));
  return [...(await baseQueue()), ...extra].filter((i) => !decided.has(i.id));
}

export function loadDecisions(): ModerationDecision[] {
  return readJson<ModerationDecision[]>(KEY_DECISIONS, []);
}

export function saveDecision(d: ModerationDecision): void {
  writeJson(KEY_DECISIONS, [...loadDecisions(), d]);
}

export function submitDemo(project: Project, fileName: string, size: number): ModerationItem {
  const extra = readJson<ModerationItem[]>(KEY_QUEUE, []);
  const item: ModerationItem = {
    id: `m-${200 + extra.length + 1}`,
    kind: "demo",
    project_slug: project.slug,
    project_title: project.title,
    author: project.author,
    submitted_at: new Date().toISOString().slice(0, 10),
    summary: `Демоверсия ${fileName}, ${size.toLocaleString("ru-RU")} байт`,
  };
  writeJson(KEY_QUEUE, [...extra, item]);
  writeJson(KEY_DEMO, [...readJson<string[]>(KEY_DEMO, []), project.slug]);
  return item;
}
