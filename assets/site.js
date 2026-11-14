(() => {
  "use strict";
  const LINKS = [
    ["index.html", "Strona główna"],
    ["moduly.html", "Moduły systemu"],
    ["prototyp.html", "Zgłoszenia obywatelskie"],
    ["centrum-jawnosci.html", "Jawność decyzji"],
    ["odpowiedzialnosc.html", "Historia spraw"],
    ["inwestycje.html", "Inwestycje publiczne"],
    ["analiza-inwestycji-czudec.html", "Analiza Czudca"],
    ["model.html", "Nasza koncepcja"],
    ["filary.html", "10 filarów"],
    ["reformy.html", "Reformy"],
    ["zasady.html", "Zasady projektowe"],
    ["admin.html", "Panel administratora"]
  ];
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const existing = [...document.querySelectorAll("body nav")];
  const nav = existing.shift() || document.createElement("nav");
  existing.forEach(item => item.remove());
  nav.className = "mp-nav";
  nav.setAttribute("aria-label", "Główne menu Modelu Państwa");
  nav.replaceChildren();
  LINKS.forEach(([href, label]) => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (current === href) {
      link.setAttribute("aria-current", "page");
    }
    nav.appendChild(link);
  });
  // Brand strip (if present) is always followed by the menu; otherwise the
  // page masthead/hero is followed by the menu. Never select an inner section.
  const brandBar = document.querySelector("body > .top, body > .topbar");
  const masthead = document.querySelector("body > header");
  const anchor = brandBar || masthead;
  if (anchor) anchor.insertAdjacentElement("afterend", nav);
  else document.body.insertBefore(nav, document.body.firstChild);

  const themeKey = "model_panstwa_v2_theme";
  let theme = "dark";
  try { theme = localStorage.getItem(themeKey) || "dark"; } catch (_) {}
  document.documentElement.dataset.theme = theme;
  const updateThemeLabel = () => {
    const active = document.documentElement.dataset.theme || "dark";
    try { localStorage.setItem(themeKey, active); } catch (_) {}
    document.querySelectorAll("#themeToggle, #theme, #globalThemeToggle, .theme, .global-theme-toggle")
      .forEach(button => button.setAttribute("aria-label", active === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw"));
  };
  document.addEventListener("click", event => {
    if (event.target.closest("#themeToggle, #theme, #globalThemeToggle, .theme, .global-theme-toggle")) {
      window.requestAnimationFrame(updateThemeLabel);
    }
  });
  updateThemeLabel();
})();