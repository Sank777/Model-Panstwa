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


  // Header sign-in popover: Supabase Auth session is shared with admin.html.
  function installHeaderLogin() {
    const header = document.querySelector(".site-header");
    const trigger = header && header.querySelector('.header-tools a[aria-label="Panel użytkownika"]');
    if (!header || !trigger || document.getElementById("leonHeaderLogin")) return;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("href", "#login");
    trigger.addEventListener("click", event => {
      event.preventDefault();
      const panel = document.getElementById("leonHeaderLogin");
      const opening = panel.hidden;
      panel.hidden = !opening;
      trigger.setAttribute("aria-expanded", String(opening));
      if (opening) panel.querySelector("input")?.focus();
    });

    const panel = document.createElement("section");
    panel.id = "leonHeaderLogin";
    panel.className = "leon-header-login";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Logowanie do panelu użytkownika");
    const heading = document.createElement("h2");
    heading.textContent = "Logowanie do panelu użytkownika";
    const form = document.createElement("form");
    form.id = "leonHeaderLoginForm";
    const email = document.createElement("input");
    email.type = "email"; email.name = "email"; email.autocomplete = "username";
    email.placeholder = "Login / e-mail"; email.setAttribute("aria-label", "Login lub e-mail"); email.required = true;
    const password = document.createElement("input");
    password.type = "password"; password.name = "password"; password.autocomplete = "current-password";
    password.placeholder = "Hasło"; password.setAttribute("aria-label", "Hasło"); password.required = true;
    const submit = document.createElement("button");
    submit.type = "submit"; submit.textContent = "Zaloguj";
    const status = document.createElement("p");
    status.id = "leonHeaderLoginStatus"; status.className = "leon-header-login-status";
    status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    const adminLink = document.createElement("a");
    adminLink.href = "admin.html"; adminLink.textContent = "Otwórz panel użytkownika";
    adminLink.hidden = true; adminLink.className = "leon-header-admin-link";
    form.append(email, password, submit);
    panel.append(heading, form, status, adminLink);
    header.append(panel);

    const style = document.createElement("style");
    style.textContent = `
      .site-header{position:relative;z-index:20}
      .leon-header-login{position:absolute;z-index:50;top:calc(100% + 8px);left:clamp(12px,12vw,190px);right:12px;
        padding:16px 18px;border:1px solid rgba(155,205,255,.35);border-radius:12px;
        background:linear-gradient(135deg,#12365d,#071a31);color:#fff;
        box-shadow:0 14px 38px rgba(0,0,0,.38)}
      .leon-header-login[hidden]{display:none}
      .leon-header-login h2{margin:0 0 12px;font-size:1rem}
      .leon-header-login form{display:grid;grid-template-columns:minmax(150px,1fr) minmax(150px,1fr) auto;gap:10px;align-items:center}
      .leon-header-login input{box-sizing:border-box;width:100%;min-width:0;padding:11px 12px;border:1px solid #7899b8;border-radius:7px;background:#f7fbff;color:#10243a;font:inherit}
      .leon-header-login button,.leon-header-admin-link{display:inline-flex;justify-content:center;align-items:center;padding:11px 16px;border:0;border-radius:7px;background:#dceeff;color:#10345a;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
      .leon-header-login button:disabled{opacity:.65;cursor:wait}
      .leon-header-login-status{margin:9px 0 0;font-size:.9rem;color:#d6e8fa}
      .leon-header-admin-link{margin-top:8px}
      @media(max-width:650px){.leon-header-login{left:10px;right:10px}.leon-header-login form{grid-template-columns:1fr}.leon-header-login button{width:100%}}
    `;
    document.head.append(style);

    document.addEventListener("click", event => {
      if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) {
        panel.hidden = true; trigger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) {
        panel.hidden = true; trigger.setAttribute("aria-expanded", "false"); trigger.focus();
      }
    });
    const moduleScript = document.createElement("script");
    moduleScript.type = "module";
    moduleScript.src = "assets/header-auth.js?v=1.0.0";
    document.body.append(moduleScript);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installHeaderLogin, {once:true});
  else installHeaderLogin();

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