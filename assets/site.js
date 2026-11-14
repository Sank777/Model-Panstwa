(() => {
 const links=[["index.html","Strona główna"],["model.html","Nasza koncepcja"],["filary.html","10 filarów"],["reformy.html","Reformy"],["zasady.html","Zasady"],["inwestycje.html","Inwestycje"],["odpowiedzialnosc.html","Odpowiedzialność"],["centrum-jawnosci.html","Centrum jawności"],["analiza-inwestycji-czudec.html","Analiza Czudca"],["prototyp.html","Zgłoszenia"],["admin.html","Panel administratora"]];
 const path=(location.pathname.split("/").pop()||"index.html").toLowerCase();
 let nav=document.querySelector("nav");
 if(!nav){nav=document.createElement("nav");const h=document.querySelector("header,.hero,.topbar,.top");(h?.parentNode||document.body).insertBefore(nav,h?.nextSibling||null);}
 nav.className="mp-nav";nav.setAttribute("aria-label","Główna nawigacja Modelu Państwa");
 nav.innerHTML=links.map(([href,label])=>'<a href="'+href+'"'+(path===href?' aria-current="page"':'')+'>'+label+'</a>').join("");
 const key="model_panstwa_v2_theme";
 let theme="dark";try{theme=localStorage.getItem(key)||"dark"}catch(e){}
 document.documentElement.dataset.theme=theme;
 const sync=()=>{const t=document.documentElement.dataset.theme||"dark";try{localStorage.setItem(key,t)}catch(e){};document.querySelectorAll("#globalThemeToggle,#theme,.theme,.global-theme-toggle").forEach(b=>{if(b)b.setAttribute("aria-label",t==="dark"?"Włącz jasny motyw":"Włącz ciemny motyw")})};
 document.addEventListener("click",e=>{const b=e.target.closest("#globalThemeToggle,#theme,.theme,.global-theme-toggle");if(!b)return;setTimeout(sync,0)});
 sync();
})();