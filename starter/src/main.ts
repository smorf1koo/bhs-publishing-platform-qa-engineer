import "./styles.css";
import { renderCatalog } from "./pages/catalog";
import { renderProject } from "./pages/project";
import { renderUpload } from "./pages/upload";
import { renderModeration } from "./pages/moderation";

const app = document.getElementById("app")!;

function setActive(name: string): void {
  document.querySelectorAll<HTMLAnchorElement>("[data-nav]").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === name);
  });
}

async function route(): Promise<void> {
  const hash = location.hash.replace(/^#/, "") || "/";
  const project = hash.match(/^\/projects\/([\w-]+)$/);
  if (project) {
    setActive("");
    await renderProject(app, project[1]);
  } else if (hash === "/upload") {
    setActive("upload");
    await renderUpload(app);
  } else if (hash === "/moderation") {
    setActive("moderation");
    await renderModeration(app);
  } else {
    setActive("catalog");
    await renderCatalog(app);
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", () => void route());
void route();
