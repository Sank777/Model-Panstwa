/* Osadza ten sam rejestr kart SWS na stronie głównej Centrum Jawności. */
(() => {
  "use strict";
  const root=document.getElementById("sws-workspace");
  const source=document.getElementById("caseGrid");
  if(!root||!source)return;
  fetch("biblioteka-spraw.html",{credentials:"same-origin"})
    .then(response=>{if(!response.ok)throw new Error("Nie udało się pobrać biblioteki SWS.");return response.text();})
    .then(markup=>{
      const parsed=new DOMParser().parseFromString(markup,"text/html");
      const original=parsed.getElementById("caseGrid");
      if(!original)throw new Error("Biblioteka nie zawiera rejestru spraw.");
      source.innerHTML=original.innerHTML;
      const script=document.createElement("script");
      script.src="assets/sws-visual.js?v=1.1.0";
      script.onerror=()=>{root.querySelector("[data-sws-detail]").textContent="Nie udało się uruchomić widoku spraw. Otwórz pełną bibliotekę."};
      document.body.append(script);
    })
    .catch(()=>{
      root.querySelector("[data-sws-count]").textContent="Brak danych";
      root.querySelector("[data-sws-detail]").textContent="Nie udało się wczytać spraw. Otwórz pełną bibliotekę.";
    });
})();
