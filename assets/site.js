(() => {
  "use strict";
  const LINKS = [
    ["index.html", "Strona główna"],
    ["inwestycje.html", "01 · Jawność wydatków"],
    ["centrum-jawnosci.html", "02 · Jawność decyzji"],
    ["prototyp.html", "Zgłoszenia obywatelskie"],
    ["moduly.html", "Architektura systemu"],
    ["model.html", "Nasza koncepcja"],
    ["filary.html", "10 filarów"],
    ["reformy.html", "Reformy"],
    ["zasady.html", "Zasady projektowe"],
    ["informacje-prawne.html", "Informacje prawne"]
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
  // Every page uses the same top sequence: brand strip -> global menu -> page hero.
  let brandBar = document.querySelector("body > .top, body > .topbar");
  if (!brandBar) {
    brandBar = document.createElement("div");
    brandBar.className = "mp-brandbar";
    const brand = document.createElement("a");
    brand.href = "index.html";
    brand.className = "mp-brand";
    brand.textContent = "MODEL PAŃSTWA";
    brandBar.appendChild(brand);
    document.body.insertBefore(brandBar, document.body.firstChild);
  }
  brandBar.classList.add("mp-brandbar");
  brandBar.insertAdjacentElement("afterend", nav);

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