(() => {
  const links = [
    ["index.html","Start"],
    ["moduly.html","Moduły systemu"],
    ["prototyp.html","Zgłoszenia"],
    ["centrum-jawnosci.html","Jawność decyzji"],
    ["odpowiedzialnosc.html","Historia spraw"],
    ["inwestycje.html","Inwestycje"],
    ["analiza-inwestycji-czudec.html","Analiza Czudca"],
    ["model.html","Koncepcja"],
    ["filary.html","10 filarów"],
    ["reformy.html","Reformy"],
    ["zasady.html","Zasady"],
    ["admin.html","Panel admina"]
  ];
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  let nav = document.querySelector("nav");
  if (!nav) {
    nav = document.createElement("nav");
    const anchor = document.querySelector("header,.hero,.topbar,.top");
    (anchor?.parentNode || document.body).insertBefore(nav, anchor?.nextSibling || null);
  }
  nav.className = "mp-nav";
  nav.setAttribute("aria-label", "Główna nawigacja Modelu Państwa");
  nav.replaceChildren();
  for (const [href,label] of links) {
    const a = document.createElement("a");
    a.href = href; a.textContent = label;
    if (path === href) a.setAttribute("aria-current","page");
    nav.appendChild(a);
  }
  const key = "model_panstwa_v2_theme";
  let theme = "dark";
  try { theme = localStorage.getItem(key) || "dark"; } catch(e) {}
  document.documentElement.dataset.theme = theme;
  const sync = () => {
    const t = document.documentElement.dataset.theme || "dark";
    try { localStorage.setItem(key,t); } catch(e) {}
    document.querySelectorAll("#globalThemeToggle,#theme,.theme,.global-theme-toggle").forEach(b => {
      b.setAttribute("aria-label",t === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw");
    });
  };
  document.addEventListener("click", e => {
    if (e.target.closest("#globalThemeToggle,#theme,.theme,.global-theme-toggle")) setTimeout(sync,0);
  });
  sync();
})();