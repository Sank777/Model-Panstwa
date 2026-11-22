/* Centrum Jawności — interaktywny przegląd 11 tematów NIK.
   Dane pochodzą z assets/cases/index.json; tekst trafia do DOM przez textContent. */
(() => {
  "use strict";
  const root = document.getElementById("nik-visual-workspace");
  if (!root) return;

  const imageById = {
    "NIK-001":"01-cyberbezpieczenstwo.svg",
    "NIK-002":"02-powodz.svg",
    "NIK-003":"03-systemy-it.svg",
    "NIK-004":"04-odra.svg",
    "NIK-005":"05-budzet.svg",
    "NIK-006":"06-wybory.svg",
    "NIK-007":"07-odpady.svg",
    "NIK-008":"08-zdrowie.svg",
    "NIK-009":"09-szkoly.svg",
    "NIK-010":"10-mieszkalnictwo.svg",
    "NIK-011":"11-schronienia.svg"
  };
  const imagePath = id => "assets/cases/illustrations/nik/" + imageById[id];
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const image = (id, alt) => {
    const node = document.createElement("img");
    node.src = imagePath(id);
    node.alt = alt;
    node.loading = "lazy";
    node.decoding = "async";
    node.width = 640;
    node.height = 400;
    return node;
  };
  const list = root.querySelector("[data-nv-list]");
  const detail = root.querySelector("[data-nv-detail]");
  const gallery = root.querySelector("[data-nv-gallery]");
  const count = root.querySelector("[data-nv-count]");

  function renderTopics(topics) {
    list.replaceChildren();
    gallery.replaceChildren();
    count.textContent = String(topics.length).padStart(2, "0") + " tematów";
    topics.forEach((topic, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "nv-topic";
      card.dataset.topicId = topic.id;
      card.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      card.append(image(topic.id, ""));
      const copy = make("span");
      copy.append(make("strong", "", topic.title));
      copy.append(make("small", "", topic.id + " · " + (topic.evidenceStatus || "status niepodany")));
      card.append(copy);
      card.addEventListener("click", () => selectTopic(topic.id, topics));
      list.append(card);

      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "nv-gallery-item";
      tile.dataset.topicId = topic.id;
      tile.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      tile.append(image(topic.id, ""));
      tile.append(make("span", "", topic.id + " · " + topic.title));
      tile.addEventListener("click", () => {
        selectTopic(topic.id, topics);
        root.querySelector(".nv-detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      gallery.append(tile);
    });
    selectTopic(topics[0].id, topics);
  }

  function selectTopic(id, topics) {
    const topic = topics.find(item => item.id === id);
    if (!topic) return;
    root.querySelectorAll("[data-topic-id]").forEach(button => {
      button.setAttribute("aria-pressed", button.dataset.topicId === id ? "true" : "false");
    });
    detail.replaceChildren();

    const top = make("div", "nv-detail-top");
    const intro = make("div");
    intro.append(make("span", "nv-kicker", topic.id + " · TEMAT KONTROLNY"));
    intro.append(make("h3", "", topic.title));
    intro.append(make("p", "nv-summary", topic.summary || "Brak opisu w rejestrze."));
    const meta = make("div", "nv-meta");
    meta.append(make("span", "", "NIK"));
    meta.append(make("span", "", topic.evidenceStatus || "status niepodany"));
    if (topic.lastSourceCheck) meta.append(make("span", "", "Weryfikacja źródeł: " + topic.lastSourceCheck));
    intro.append(meta);
    top.append(intro);
    top.append(image(topic.id, "Ilustracja: " + topic.title).classList.add("nv-hero-image") || intro.lastChild);
    // Dodajemy obraz jawnie, bez HTML wstrzykiwanego z danych.
    const hero = top.lastChild;
    if (hero && hero.tagName === "IMG") hero.className = "nv-hero-image";
    detail.append(top);

    const blocks = make("div", "nv-analysis");
    (topic.analysisBlocks || []).slice(0, 3).forEach(block => {
      const section = make("section", "nv-block");
      section.append(make("h4", "", block.title || "Analiza"));
      if (block.lead) section.append(make("p", "nv-lead", block.lead));
      const ul = make("ul");
      (block.points || []).forEach(point => ul.append(make("li", "", point)));
      section.append(ul);
      blocks.append(section);
    });
    detail.append(blocks);

    const sources = make("div", "nv-sources");
    sources.append(make("strong", "", "Źródła przypisane do tematu"));
    const links = make("div", "nv-source-links");
    (topic.sources || []).forEach(source => {
      if (!source.url || !/^https:\/\//i.test(source.url)) return;
      const a = make("a", "", source.label || "Otwórz źródło");
      a.href = source.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      links.append(a);
    });
    if (!links.childElementCount) links.append(make("span", "", "Brak odnośników w rejestrze."));
    sources.append(links);
    detail.append(sources);
  }

  fetch("assets/cases/index.json", { credentials: "same-origin" })
    .then(response => {
      if (!response.ok) throw new Error("Nie udało się pobrać rejestru tematów.");
      return response.json();
    })
    .then(data => {
      const topics = (Array.isArray(data.nikTopics) ? data.nikTopics : [])
        .filter(topic => /^NIK-0(?:0[1-9]|1[01])$/.test(topic.id) && imageById[topic.id])
        .sort((a, b) => a.id.localeCompare(b.id, "en"));
      if (topics.length !== 11) throw new Error("Rejestr nie zawiera kompletu 11 tematów NIK.");
      renderTopics(topics);
    })
    .catch(error => {
      list.replaceChildren(make("p", "nv-error", "Nie udało się wczytać tematów. " + error.message));
      detail.replaceChildren(make("p", "nv-error", "Treści analizy nie zostały zastąpione danymi przykładowymi."));
      gallery.replaceChildren();
      count.textContent = "brak danych";
    });
})();
