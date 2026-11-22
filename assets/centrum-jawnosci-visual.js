/* Centrum Jawności — jednolity widok 11 tematów NIK.
   Dane i ilustracje są pobierane z rejestru assets/cases/index.json. */
(() => {
  "use strict";
  const root = document.getElementById("nik-visual-workspace");
  if (!root) return;

  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = String(value);
    return node;
  };
  const safeImagePath = topic => {
    const src = topic.imagePlan && topic.imagePlan.src;
    return typeof src === "string" &&
      /^assets\/cases\/illustrations\/nik\/[a-z0-9-]+\.svg$/i.test(src)
      ? src : null;
  };
  const list = root.querySelector("[data-nv-items]");
  const detail = root.querySelector("[data-nv-detail]");
  const count = root.querySelector("[data-nv-count]");

  function addSection(parent, title, className) {
    const section = make("section", className || "nv-section");
    section.append(make("h4", "", title));
    parent.append(section);
    return section;
  }

  function renderTopics(topics) {
    list.replaceChildren();
    count.textContent = String(topics.length).padStart(2, "0") + " tematów";
    topics.forEach((topic, index) => {
      const card = make("button", "nv-topic");
      card.type = "button";
      card.dataset.topicId = topic.id;
      card.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      const path = safeImagePath(topic);
      if (path) {
        const thumb = make("img");
        thumb.src = path;
        thumb.alt = "";
        thumb.loading = "lazy";
        thumb.decoding = "async";
        card.append(thumb);
      } else {
        card.append(make("span", "nv-topic-placeholder", "NIK"));
      }
      const copy = make("span");
      copy.append(make("strong", "", topic.title));
      copy.append(make("small", "", topic.id + " · " + (topic.evidenceStatus || "status niepodany")));
      card.append(copy);
      card.addEventListener("click", () => selectTopic(topic.id, topics));
      list.append(card);
    });
    if (topics.length) selectTopic(topics[0].id, topics);
  }

  function selectTopic(id, topics) {
    const topic = topics.find(item => item.id === id);
    if (!topic) return;
    root.querySelectorAll("[data-topic-id]").forEach(button => {
      button.setAttribute("aria-pressed", button.dataset.topicId === id ? "true" : "false");
    });
    detail.replaceChildren();

    const top = make("header", "nv-detail-top");
    const intro = make("div", "nv-intro");
    intro.append(make("span", "nv-kicker", topic.id + " · TEMAT KONTROLNY"));
    intro.append(make("h3", "", topic.title));
    intro.append(make("p", "nv-summary", topic.summary || "Brak opisu w rejestrze."));
    const meta = make("div", "nv-meta");
    meta.append(make("span", "", "NIK"));
    meta.append(make("span", "", topic.evidenceStatus || "status niepodany"));
    if (topic.lastSourceCheck) meta.append(make("span", "", "Weryfikacja źródeł: " + topic.lastSourceCheck));
    intro.append(meta);
    top.append(intro);

    const path = safeImagePath(topic);
    if (path) {
      const hero = make("img", "nv-hero-image");
      hero.src = path;
      hero.alt = (topic.imagePlan && topic.imagePlan.alt) || ("Ilustracja poglądowa: " + topic.title);
      hero.loading = "lazy";
      hero.decoding = "async";
      top.append(hero);
      if (topic.imagePlan && topic.imagePlan.caption) {
        top.append(make("p", "nv-image-caption", topic.imagePlan.caption));
      }
    } else {
      top.append(make("div", "nv-image-placeholder", "Brak przypisanej ilustracji"));
    }
    detail.append(top);

    const evidence = addSection(detail, "Ustalenia i zakres materiału", "nv-evidence-section");
    if (topic.preliminaryNote) evidence.append(make("p", "nv-preliminary-note", topic.preliminaryNote));
    const facts = Array.isArray(topic.preliminaryFacts) ? topic.preliminaryFacts : [];
    if (facts.length) {
      const factList = make("ul", "nv-facts");
      facts.forEach(fact => {
        const item = make("li", "nv-fact");
        item.append(make("span", "nv-fact-text", fact.text || ""));
        if (fact.scope) item.append(make("small", "nv-fact-scope", fact.scope));
        factList.append(item);
      });
      evidence.append(factList);
    } else {
      evidence.append(make("p", "nv-no-facts", "W rejestrze nie ma jeszcze wyodrębnionych ustaleń. To miejsce pozostaje oznaczone jako wymagające dalszej weryfikacji."));
    }
    if (topic.noteStatus) evidence.append(make("p", "nv-note-status", topic.noteStatus));

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

    const sources = addSection(detail, "Źródła przypisane do tematu", "nv-sources");
    const links = make("div", "nv-source-links");
    (topic.sources || []).forEach(source => {
      if (!source.url || !/^https:\/\//i.test(source.url)) return;
      const link = make("a", "", source.label || "Otwórz źródło");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      links.append(link);
    });
    if (!links.childElementCount) links.append(make("span", "nv-no-sources", "Brak odnośników w rejestrze."));
    sources.append(links);
  }

  fetch("assets/cases/index.json", { credentials: "same-origin" })
    .then(response => {
      if (!response.ok) throw new Error("Nie udało się pobrać rejestru tematów.");
      return response.json();
    })
    .then(data => {
      const topics = (Array.isArray(data.nikTopics) ? data.nikTopics : [])
        .filter(topic => /^NIK-0(?:0[1-9]|1[01])$/.test(topic.id))
        .sort((a, b) => a.id.localeCompare(b.id, "en"));
      if (topics.length !== 11) throw new Error("Rejestr nie zawiera kompletu 11 tematów NIK.");
      renderTopics(topics);
    })
    .catch(error => {
      list.replaceChildren(make("p", "nv-error", "Nie udało się wczytać tematów. " + error.message));
      detail.replaceChildren(make("p", "nv-error", "Treści analizy nie zostały zastąpione danymi przykładowymi."));
      count.textContent = "brak danych";
    });
})();
