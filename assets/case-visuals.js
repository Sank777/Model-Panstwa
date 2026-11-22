/* Centrum Jawności — wspólny montaż lokalnych ilustracji na każdej głębokości URL. */
(() => {
  "use strict";
  const scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : new URL("assets/case-visuals.js", document.baseURI).href;
  const ASSET_ROOT = new URL("./", scriptUrl);
  const asset = (path) => {
    const relative = String(path || "").replace(/^assets\//, "");
    const url = new URL(relative, ASSET_ROOT);
    if (url.origin !== location.origin || !url.pathname.startsWith(ASSET_ROOT.pathname)) {
      throw new Error("case-visual-asset-path-rejected");
    }
    return url.href;
  };
  const visuals = Object.freeze({
    cyber: ["cases/illustrations/nik/01-cyberbezpieczenstwo.svg", "Cyberbezpieczeństwo usług kluczowych — ilustracja poglądowa"],
    flood: ["cases/illustrations/nik/02-powodz.svg", "Reakcja państwa na powódź — ilustracja poglądowa"],
    it: ["cases/illustrations/nik/03-systemy-it.svg", "Publiczne systemy IT — ilustracja poglądowa"],
    odra: ["cases/illustrations/nik/04-odra.svg", "Kryzys ekologiczny na Odrze — ilustracja poglądowa"],
    budget: ["cases/illustrations/nik/05-budzet.svg", "Wykonanie budżetu państwa — ilustracja poglądowa"],
    election: ["cases/illustrations/nik/06-wybory.svg", "Przygotowanie wyborów korespondencyjnych — ilustracja poglądowa"],
    waste: ["cases/illustrations/nik/07-odpady.svg", "Gospodarka odpadami i recykling — ilustracja poglądowa"],
    health: ["cases/illustrations/nik/08-zdrowie.svg", "Ochrona zdrowia — ilustracja poglądowa"],
    schools: ["cases/illustrations/nik/09-szkoly.svg", "Nadzór nad szkołami publicznymi — ilustracja poglądowa"],
    housing: ["cases/illustrations/nik/10-mieszkalnictwo.svg", "Mieszkalnictwo — ilustracja poglądowa"],
    shelter: ["cases/illustrations/nik/11-schronienia.svg", "Miejsca schronienia i budowle ochronne — ilustracja poglądowa"],
    "psp-ev": ["psp-ev.svg", "Rozpoznanie samochodu elektrycznego przez strażaków — ilustracja poglądowa"],
    "psp-pv": ["psp-pv.svg", "Rozpoznanie instalacji fotowoltaicznej — ilustracja poglądowa"],
    "psp-ochrona": ["psp-ochrona.svg", "Wyposażenie ochronne ratownika — ilustracja poglądowa"]
  });
  const addImage = (host, key, hero = false) => {
    const item = visuals[key];
    if (!item || host.querySelector(":scope > .case-topic-visual, :scope > .case-hero-visual")) return;
    const img = document.createElement("img");
    img.className = hero ? "case-hero-visual" : "case-topic-visual";
    img.src = asset(item[0]);
    img.alt = item[1];
    img.width = 960; img.height = 540;
    img.sizes = hero ? "(max-width: 900px) 100vw, 1100px" : "(max-width: 700px) 100vw, 50vw";
    img.loading = hero ? "eager" : "lazy";
    img.decoding = "async";
    if (hero) {
      img.fetchPriority = "high";
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
    img.addEventListener("error", () => {
      img.dataset.visualState = "error";
      img.alt = item[1] + " (plik graficzny niedostępny)";
    }, { once: true });
    img.addEventListener("load", () => { img.dataset.visualState = "loaded"; }, { once: true });
  };
  window.CaseVisuals = Object.freeze({
    mount(host, key, hero = true) { if (host && key) addImage(host, key, hero); },
    asset
  });
  document.querySelectorAll(".case-card[data-case-visual], .nik-topic-card[data-case-visual]")
    .forEach(node => addImage(node, node.dataset.caseVisual, false));
  document.querySelectorAll(".case-hero[data-case-visual]")
    .forEach(node => addImage(node, node.dataset.caseVisual, true));
})();