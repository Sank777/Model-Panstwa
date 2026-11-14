(() => {
  const links = [["index.html","Strona główna"],["moduly.html","Moduły systemu"],["prototyp.html","Zgłoszenia obywatelskie"],["centrum-jawnosci.html","Jawność decyzji"],["odpowiedzialnosc.html","Historia spraw"],["inwestycje.html","Inwestycje publiczne"],["analiza-inwestycji-czudec.html","Analiza Czudca"],["model.html","Nasza koncepcja"],["filary.html","10 filarów"],["reformy.html","Reformy"],["zasady.html","Zasady projektowe"],["admin.html","Panel administratora"]];
  const path=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const navs=[...document.querySelectorAll("nav")];
  let nav=navs.shift();
  for(const duplicate of navs) duplicate.remove();
  if(!nav) nav=document.createElement("nav");
  nav.className="mp-nav";nav.setAttribute("aria-label","Główne menu Modelu Państwa");nav.replaceChildren();
  for(const [href,label] of links){const a=document.createElement("a");a.href=href;a.textContent=label;if(path===href)a.setAttribute("aria-current","page");nav.appendChild(a);}
  const header=document.querySelector("body > header, body > .hero, body > .topbar, body > .top");
  if(header) header.insertAdjacentElement("afterend",nav); else document.body.insertBefore(nav,document.body.firstChild);
  const key="model_panstwa_v2_theme";let theme="dark";try{theme=localStorage.getItem(key)||"dark"}catch(e){}document.documentElement.dataset.theme=theme;
  const sync=()=>{const t=document.documentElement.dataset.theme||"dark";try{localStorage.setItem(key,t)}catch(e){}document.querySelectorAll("#globalThemeToggle,#themeToggle,#theme,.theme,.global-theme-toggle").forEach(b=>b.setAttribute("aria-label",t==="dark"?"Włącz jasny motyw":"Włącz ciemny motyw"));};
  document.addEventListener("click",e=>{if(e.target.closest("#globalThemeToggle,#themeToggle,#theme,.theme,.global-theme-toggle"))setTimeout(sync,0);});sync();
})();