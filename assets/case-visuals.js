/* Centrum Jawności — lokalne ilustracje spraw, bez zewnętrznych żądań. */
(() => {
  "use strict";
  const visuals = Object.freeze({
    cyber: ["assets/cases/cyber-infrastructure-hero.webp", "Ilustracja poglądowa infrastruktury energetycznej i cyberbezpieczeństwa — obraz wygenerowany, nie dokumentacja zdarzenia"],
    flood: ["assets/cases/flood.svg", "Reakcja państwa na powódź — ilustracja poglądowa"],
    it: ["assets/cases/it.svg", "Publiczne systemy IT — ilustracja poglądowa"],
    odra: ["assets/cases/odra.svg", "Kryzys ekologiczny na Odrze — ilustracja poglądowa"],
    budget: ["assets/cases/budget.svg", "Wykonanie budżetu państwa — ilustracja poglądowa"],
    election: ["assets/cases/election.svg", "Przygotowanie wyborów korespondencyjnych — ilustracja poglądowa"],
    waste: ["assets/cases/waste.svg", "Gospodarka odpadami i recykling — ilustracja poglądowa"],
    health: ["assets/cases/health.svg", "Zamawianie świadczeń zdrowotnych w szpitalach — ilustracja poglądowa"],
    schools: ["assets/cases/schools.svg", "Nadzór nad szkołami publicznymi — ilustracja poglądowa"],
    housing: ["assets/cases/housing.svg", "Rozwój mieszkalnictwa — ilustracja poglądowa"],
    shelter: ["assets/cases/shelter.svg", "Miejsca schronienia i budowle ochronne — ilustracja poglądowa"],
    "psp-ev": ["assets/psp-ev.svg", "Rozpoznanie samochodu elektrycznego przez strażaków — ilustracja poglądowa"],
    "psp-pv": ["assets/psp-pv.svg", "Rozpoznanie instalacji fotowoltaicznej — ilustracja poglądowa"],
    "psp-ochrona": ["assets/psp-ochrona.svg", "Wyposażenie ochronne ratownika — ilustracja poglądowa"]
  });
  const addImage = (host, key, hero) => {
    const item = visuals[key];
    if (!item || host.querySelector(":scope > .case-topic-visual, :scope > .case-hero-visual")) return;
    const img = document.createElement("img");
    img.className = hero ? "case-hero-visual" : "case-topic-visual";
    img.src = Array.isArray(item) ? item[0] : item.src;
    img.alt = Array.isArray(item) ? item[1] : item.alt;
    img.width = 960;
    img.height = 540;
    img.sizes = hero ? "(max-width: 900px) 100vw, 1100px" : "(max-width: 700px) 100vw, 50vw";
    if (typeof item === "object" && item.srcset) img.srcset = item.srcset;
    img.loading = hero ? "eager" : "lazy";
    img.decoding = "async";
    img.fetchPriority = hero ? "high" : "auto";
    if (hero) {
      const heading = host.querySelector("h1");
      host.insertBefore(img, heading || host.firstChild);
    } else {
      const top = host.querySelector(":scope > .case-top");
      if (top) top.insertAdjacentElement("afterend", img);
      else host.insertBefore(img, host.firstChild);
      const caption = document.createElement("p");
      caption.className = "case-topic-caption";
      caption.textContent = "Ilustracja poglądowa · nie jest dokumentem źródłowym";
      img.insertAdjacentElement("afterend", caption);
    }
  };
  window.CaseVisuals = Object.freeze({ mount(host, key, hero = true) { if (host && key) addImage(host, key, hero); } });
  document.querySelectorAll(".case-card[data-case-visual], .nik-topic-card[data-case-visual]").forEach((node) => addImage(node, node.dataset.caseVisual, false));
  document.querySelectorAll(".case-hero[data-case-visual]").forEach((node) => addImage(node, node.dataset.caseVisual, true));
})();