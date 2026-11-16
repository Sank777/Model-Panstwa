(() => {
  "use strict";
  const LINKS = [
    ["index.html", "Strona główna"],
    ["inwestycje.html", "Jawność wydatków"],
    ["centrum-jawnosci.html", "Jawność decyzji"],
    ["prototyp.html", "Zgłoszenia obywatelskie"],
    ["moduly.html", "Architektura systemu"],
    ["model.html", "Nasza koncepcja"],
    ["filary.html", "10 filarów"],
    ["reformy.html", "Reformy"],
    ["zasady.html", "Zasady projektowe"],
    ["informacje-prawne.html", "Informacje prawne"]
  ];
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

  // Ambient motion: subtle "living photograph" treatment for existing artwork.
  // No image replacement, no extra network requests, and no motion for reduced-data/accessibility modes.
  function installAmbientMotion() {
    const motionStyle = document.createElement("style");
    motionStyle.dataset.leonAmbientMotion = "1";
    motionStyle.textContent = `
      .leon-ambient-target { will-change: transform; transform-origin: center; }
      .leon-ambient-target[data-ambient-active="true"] { animation: leon-photo-drift 22s ease-in-out infinite alternate; }
      @keyframes leon-photo-drift {
        0% { transform: scale(1.015) translate3d(0,0,0); }
        100% { transform: scale(1.055) translate3d(-.45%, -.35%, 0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .leon-ambient-target { animation: none !important; transform: none !important; will-change: auto; }
      }
    `;
    document.head.appendChild(motionStyle);

    const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !(navigator.connection && navigator.connection.saveData) &&
      "IntersectionObserver" in window;
    if (!motionAllowed) return;

    const selector = ".hero-banner > .visual-engine-image img, .pillar-tile > .visual-engine-tile-image";
    const active = new WeakSet();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const node = entry.target;
        if (entry.isIntersecting && document.visibilityState === "visible") {
          node.dataset.ambientActive = "true";
          active.add(node);
        } else {
          delete node.dataset.ambientActive;
          active.delete(node);
        }
      });
    }, { rootMargin: "80px 0px", threshold: 0.01 });

    const observe = root => {
      if (root.matches && root.matches(selector) && !root.classList.contains("leon-ambient-target")) {
        root.classList.add("leon-ambient-target");
        observer.observe(root);
      }
      if (root.querySelectorAll) root.querySelectorAll(selector).forEach(node => {
        if (!node.classList.contains("leon-ambient-target")) {
          node.classList.add("leon-ambient-target");
          observer.observe(node);
        }
      });
    };
    observe(document);
    const mutations = new MutationObserver(records => records.forEach(record =>
      record.addedNodes.forEach(node => { if (node.nodeType === 1) observe(node); })
    ));
    mutations.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") {
        document.querySelectorAll(".leon-ambient-target[data-ambient-active]").forEach(node => {
          delete node.dataset.ambientActive;
        });
      } else {
        observe(document);
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installAmbientMotion, { once: true });
  } else {
    installAmbientMotion();
  }
})();