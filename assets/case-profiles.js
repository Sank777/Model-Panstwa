/* Centrum Jawności — wspólne profile uczestników, bez zależności i bez żądań sieciowych. */
(() => {
  "use strict";
  const clean = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
  const slug = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const records = [...document.querySelectorAll(".person-record")];
  if (!records.length) return;
  const entries = records.map((record) => {
    const summary = record.querySelector(":scope > summary");
    const label = clean(summary);
    const stage = clean(record.closest(".stage-accordion")?.querySelector(":scope > summary .stage-heading")) || "Etap nieprzypisany";
    const role = clean(record.querySelector(".person-record-body"));
    const key = slug(label);
    record.dataset.personId = key;
    record.dataset.personLabel = label;
    return { key, label, stage, role, record };
  });
  const style = document.createElement("style");
  style.textContent = `
    .person-record>summary{cursor:pointer}
    .person-record>summary:focus-visible{outline:3px solid #6da9e8;outline-offset:3px}
    .person-profile-dialog{width:min( min(92vw,680px), calc(100vw - 2rem));max-height:min(82vh,760px);padding:0;border:1px solid var(--mp-border,#456);border-radius:16px;background:var(--mp-surface,#142334);color:var(--mp-text,#f4f7fa);box-shadow:0 20px 70px #0008}
    .person-profile-dialog::backdrop{background:#07111dcc;backdrop-filter:blur(3px)}
    .person-profile-head{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 1.1rem;background:var(--mp-surface,#142334);border-bottom:1px solid var(--mp-border,#456)}
    .person-profile-head h2{font-size:1.15rem;line-height:1.3;margin:0}
    .person-profile-close{border:1px solid var(--mp-border,#456);border-radius:9px;padding:.45rem .7rem;background:transparent;color:inherit;cursor:pointer}
    .person-profile-content{padding:1rem 1.1rem 1.25rem;overflow:auto}
    .person-profile-item{padding:.8rem 0;border-bottom:1px solid var(--mp-border,#456)}
    .person-profile-item:last-child{border:0}
    .person-profile-item h3{font-size:.95rem;margin:0 0 .35rem}
    .person-profile-note{font-size:.88rem;opacity:.82}
    @media(prefers-reduced-motion:no-preference){.person-profile-dialog[open]{animation:profileIn .14s ease-out}}
    @keyframes profileIn{from{opacity:.6;transform:translateY(5px)}to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){.person-profile-dialog{scroll-behavior:auto}}
  `;
  document.head.append(style);
  const dialog = document.createElement("dialog");
  dialog.className = "person-profile-dialog";
  dialog.setAttribute("aria-labelledby", "person-profile-title");
  dialog.innerHTML = '<div class="person-profile-head"><h2 id="person-profile-title"></h2><button class="person-profile-close" type="button">Zamknij</button></div><div class="person-profile-content"></div>';
  document.body.append(dialog);
  const close = () => dialog.close();
  dialog.querySelector("button").addEventListener("click", close);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && dialog.open) close(); });
  records.forEach((record) => {
    const summary = record.querySelector(":scope > summary");
    summary.setAttribute("aria-haspopup", "dialog");
    summary.title = "Otwórz wspólną kartę udziału w sprawie";
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      const item = entries.find((entry) => entry.record === record);
      const linked = entries.filter((entry) => entry.key === item.key);
      dialog.querySelector("#person-profile-title").textContent = item.label;
      const content = dialog.querySelector(".person-profile-content");
      content.replaceChildren();
      const intro = document.createElement("p");
      intro.className = "person-profile-note";
      intro.textContent = "Zestawienie udziału w tej karcie sprawy. Opisy ról nie przesądzają o odpowiedzialności prawnej.";
      content.append(intro);
      linked.forEach((entry) => {
        const section = document.createElement("section");
        section.className = "person-profile-item";
        const heading = document.createElement("h3");
        heading.textContent = entry.stage;
        const description = document.createElement("p");
        description.textContent = entry.role;
        section.append(heading, description);
        content.append(section);
      });
      if (!linked.length) {
        const empty = document.createElement("p");
        empty.textContent = "Brak dodatkowych powiązań w tej karcie.";
        content.append(empty);
      }
      if (typeof dialog.showModal === "function") dialog.showModal();
      else { dialog.setAttribute("open", ""); }
    });
  });
})();