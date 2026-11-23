(()=>{"use strict";
const root=document.getElementById("f10-cru-trace");if(!root)return;
const list=root.querySelector("#cru-list"),count=root.querySelector("#cru-count"),query=root.querySelector("#cru-query"),filter=root.querySelector("#cru-filter");
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const safeLink=(label,url)=>{if(!url||!url.startsWith("https://"))return null;const a=make("a","",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
let records=[];
function render(){
 const q=query.value.trim().toLocaleLowerCase("pl"),mode=filter.value;
 const shown=records.filter(r=>{const hay=[r.id,r.contractNo,r.authority,r.contractor,r.subject,r.status].filter(Boolean).join(" ").toLocaleLowerCase("pl");return (!q||hay.includes(q))&&(!mode||(mode==="restricted"?(r.amount?.value===null||r.amount?.value===undefined):r.amount?.value!==null&&r.amount?.value!==undefined))});
 count.textContent=shown.length+" z "+records.length+" wpisów";
 list.replaceChildren();
 if(!shown.length){list.append(make("p","f10-cru-empty","Nie znaleziono wpisów spełniających kryteria."));return}
 shown.forEach(r=>{
  const card=make("article","f10-cru-card"),top=make("div","f10-cru-meta");
  top.append(make("span","",r.id),make("span","",r.status||"Status niepodany"));card.append(top);
  card.append(make("h5","",r.subject||"Przedmiot niepodany"));
  card.append(make("p","","Jednostka: "+(r.authority||"nieustalona")));
  card.append(make("p","","Kontrahent: "+(r.contractor||"dane nieujawnione / nieustalone")));
  card.append(make("p","","Umowa: "+(r.contractNo||"numer niepodany")+" · zawarcie: "+(r.date||"data niepodana")));
  const amount=r.amount?.value===null||r.amount?.value===undefined?"Nieujawniona / wyłączona z jawności":new Intl.NumberFormat("pl-PL",{style:"currency",currency:r.amount.currency||"PLN",maximumFractionDigits:2}).format(r.amount.value);
  card.append(make("p","","Wartość ujawniona: "+amount+(r.amount?.basis?" · "+r.amount.basis:"")));
  if(r.statusNote)card.append(make("p","",r.statusNote));
  const d=make("details"),sum=make("summary","","Dokumenty, braki i granice ustaleń");d.append(sum);
  const docs=make("div");(r.documents||[]).forEach(doc=>{const a=safeLink(doc.label||"Dokument",doc.url);if(a)docs.append(a)});if(!docs.childElementCount)docs.append(make("p","","Brak dołączonych dokumentów poza wpisem rejestrowym."));
  d.append(docs,make("h6","","Czego jeszcze nie wiemy"));
  const ul=make("ul");(r.unknowns||[]).forEach(x=>ul.append(make("li","",x)));d.append(ul);
  if(r.reviewNote)d.append(make("p","",r.reviewNote));
  const source=safeLink("Otwórz oryginalny wpis CRU ↗",r.recordUrl);if(source){source.style.display="inline-block";source.style.marginTop=".5rem";d.append(source)}
  card.append(d);list.append(card);
 });
}
query.addEventListener("input",render);filter.addEventListener("change",render);
fetch("assets/cru/contracts.json?v=1.0.0",{credentials:"same-origin",cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(data=>{records=Array.isArray(data.records)?data.records:[];render()}).catch(()=>{count.textContent="Rejestr niedostępny";list.replaceChildren(make("p","f10-cru-empty","Nie udało się wczytać lokalnego rejestru CRU. Otwórz publiczny rejestr źródłowy; nie wyświetlamy danych przykładowych ani domyślnych."))});
})();