/* SWS — lista spraw, niezależne archiwum NIK i przykładowe drzewa analizy. */
(() => {
  "use strict";
  const root=document.getElementById("sws-workspace");
  const source=document.getElementById("caseGrid");
  if(!root||!source)return;
  const list=root.querySelector("[data-sws-list]");
  const detail=root.querySelector("[data-sws-detail]");
  const count=root.querySelector("[data-sws-count]");
  const cards=[...source.querySelectorAll("article.case-card")].filter(card=>/^SWS-PL-\d{3}/.test(card.querySelector(".case-id")?.textContent?.trim()||""));
  if(!cards.length)return;
  let registry=[];
  const items=cards.map(card=>{
    const id=card.querySelector(".case-id")?.textContent?.match(/SWS-PL-\d{3}/)?.[0]||card.id.replace("case-","");
    const title=card.querySelector("h2")?.textContent?.trim()||id;
    const status=card.querySelector(".case-badge")?.textContent?.trim()||"Status w karcie";
    const button=document.createElement("button");
    button.type="button";button.className="sws-topic";button.dataset.swsId=id;
    button.dataset.type=card.dataset.type||"";button.dataset.status=card.dataset.status||"";
    button.dataset.search=(card.dataset.search||"")+" "+card.textContent;
    button.setAttribute("aria-pressed","false");
    const code=document.createElement("span");code.className="sws-topic-id";code.textContent=id.replace("SWS-PL-","");
    const copy=document.createElement("span");const strong=document.createElement("strong");strong.textContent=title;
    const small=document.createElement("small");small.textContent=status;copy.append(strong,small);button.append(code,copy);
    const item={id,card,button};button.addEventListener("click",()=>select(id));list.append(button);return item;
  });
  count.textContent=cards.length+" spraw";
  function appendTree(clone,id){
    const groups={"SWS-PL-001":[["Przygotowanie inwestycji",["potrzeba i warianty przeprawy","badania geologiczne i hydrologiczne","projekt budowlany i techniczny","pozwolenia i uzgodnienia"]],["Realizacja robót",["wybór projektanta i wykonawcy","umowa i harmonogram","dziennik budowy i nadzór","badania materiałów i konstrukcji"]],["Odbiór i utrzymanie",["dokumentacja powykonawcza","protokół odbioru i usterki","gwarancja, przeglądy i bezpieczeństwo"]]],"SWS-PL-002":[["Finansowanie",["promesa i warunki programu","wkład własny JST","zmiany budżetu i WPF"]],["Przetarg i umowa",["opis robót i kosztorys","oferty i wybór wykonawcy","podwykonawcy i aneksy"]],["Płatności i efekt",["protokoły częściowe","faktury a rzeczywisty postęp","odbiór końcowy i rozliczenie dotacji"]]],"SWS-PL-003":[["Dochody i wydatki",["plan budżetu i jego zmiany","wykonanie dochodów","wydatki bieżące i inwestycyjne"]],["Zadłużenie i płynność",["kredyty, pożyczki i obligacje","zobowiązania wymagalne","koszty obsługi długu"]],["Nadzór i naprawa",["opinie RIO i WPF","uchwały i zarządzenia","zalecenia i wykonanie programu naprawczego"]]],"SWS-PL-004":[["Publikacja w BIP",["uchwały, zarządzenia i rejestry","umowy, konkursy i zamówienia","nagrania sesji i głosowania"]],["Wniosek obywatela",["data wpływu i zakres żądania","termin i sposób odpowiedzi","odmowa, anonimizacja lub opłata"]],["Droga odwoławcza",["skarga na bezczynność","decyzja odmowna","orzeczenie sądu i wykonanie"]]],"SWS-PL-005":[["Przygotowanie zakupu",["opis rzeczywistej potrzeby","szacowanie wartości i podobne zakupy","podział na części i warunki udziału"]],["Konkurencja",["kryteria ceny i jakości","liczba ofert i pytania wykonawców","wykluczenia i odrzucenia"]],["Wybór i realizacja",["uzasadnienie wyboru","odwołanie do KIO","umowa, zmiany i odbiór"]]],"SWS-PL-006":[["Powstanie danych",["plan i wykonanie budżetu","księgi rachunkowe jednostek","fundusze i przepływy poza budżetem"]],["Sprawozdawczość",["sprawozdania miesięczne i kwartalne","sprawozdania roczne i finansowe","korekty i uzgodnienia danych"]],["Jawność i porównywalność",["publikacja danych i metadane","porównanie planu, wykonania i celu","dane krajowe i metodologia UE"]]],"SWS-PL-007":[["Zasady zakupów podprogowych",["regulamin wewnętrzny i progi","wyłączenia i uzasadnienie trybu","szacowanie łącznej wartości"]],["Otwarte rozeznanie rynku",["publikacja zapytania w BIP lub platformie","lista zaproszonych dostawców","termin i równe informacje dla oferentów"]],["Wybór i ślad decyzji",["porównanie ceny, jakości i terminu","protokół i uzasadnienie wyboru","umowa, odbiór i ewidencja"]]]}[id],body=clone.querySelector(".case-detail");if(!groups||!body)return;
    const wrap=document.createElement("details");wrap.className="sws-example-tree";
    const summary=document.createElement("summary");summary.textContent="Rozwiń drzewo sprawy — przykładowe ścieżki analizy";wrap.append(summary);
    const note=document.createElement("p");note.className="sws-tree-note";note.textContent="Mapa pytań i dokumentów do sprawdzenia. Nie oznacza, że każdy etap wystąpił w tej konkretnej sprawie.";wrap.append(note);
    const roots=document.createElement("ol");roots.className="sws-tree-roots";
    groups.forEach(([name,children])=>{const li=document.createElement("li"),branch=document.createElement("details"),head=document.createElement("summary");head.textContent=name;branch.append(head);const ul=document.createElement("ul");children.forEach(label=>{const child=document.createElement("li");child.textContent=label;ul.append(child);});branch.append(ul);li.append(branch);roots.append(li);});
    wrap.append(roots);body.append(wrap);
  }
  function appendSources(clone,id){
    const record=registry.find(x=>x.id===id),body=clone.querySelector(".case-detail");if(!record||!Array.isArray(record.sources)||!body)return;
    const old=body.querySelector(":scope > .case-links");if(old)old.remove();
    const section=document.createElement("section");section.className="sws-analysis-block sws-sources";
    const heading=document.createElement("h3");heading.textContent="ŹRÓDŁA I DOKUMENTY";section.append(heading);
    const links=document.createElement("div");links.className="case-links";
    record.sources.forEach(src=>{if(!src.url||!/^https:\/\//.test(src.url))return;const a=document.createElement("a");a.href=src.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=src.label||src.url;links.append(a);});
    section.append(links);body.append(section);
  }
  function renderNikArchive(topics){
    const host=document.querySelector("[data-sws-nik-archive]");if(!host)return;
    const grid=host.querySelector(".sws-nik-archive-grid");if(!grid)return;grid.replaceChildren();
    topics.forEach((topic,index)=>{const a=document.createElement("a");a.className="sws-nik-subtopic";a.href="analizy-nik.html?topic="+encodeURIComponent(topic.id);
      const n=document.createElement("span");n.className="sws-nik-subtopic-number";n.textContent=String(index+1).padStart(2,"0");
      const t=document.createElement("span");t.textContent=topic.title||topic.id;a.append(n,t);grid.append(a);});
  }
  function select(id){
    const item=items.find(x=>x.id===id);if(!item)return;
    items.forEach(x=>x.button.setAttribute("aria-pressed",x.id===id?"true":"false"));
    detail.replaceChildren();
    const clone=item.card.cloneNode(true);clone.removeAttribute("id");clone.removeAttribute("data-search");clone.classList.add("sws-selected-card");
    clone.querySelectorAll("[id]").forEach(node=>node.removeAttribute("id"));
    clone.querySelectorAll("details").forEach(node=>node.open=true);
    const body=clone.querySelector(".case-detail");
    if(body){
      const oldLinks=body.querySelector(":scope > .case-links");if(oldLinks)oldLinks.remove();
      const headings=[...body.querySelectorAll(":scope > h3")];
      headings.forEach(heading=>{
        const section=document.createElement("section");section.className="sws-analysis-block";
        const title=document.createElement("h3"),label=heading.textContent.trim().toLocaleLowerCase("pl");
        if(/powiązan|przebieg|testujemy/.test(label))title.textContent="POWIĄZANIA I PRZEBIEG SPRAWY";
        else if(/granice|wywniosk|prawo do wyjaśnień|uwaga prawna|ograniczen/.test(label))title.textContent="GRANICE WNIOSKÓW I WYJAŚNIENIA";
        else if(/pytan|edukacyjn|lekcj|wniosek|co powinien/.test(label))title.textContent="PYTANIA KONTROLNE I LEKCJE";
        else title.textContent="USTALENIA I MATERIAŁY";
        const original=heading.cloneNode(true);original.className="sws-source-heading";section.append(title,original);
        let node=heading.nextSibling;while(node&&!(node.nodeType===1&&node.tagName==="H3")){const next=node.nextSibling;section.append(node);node=next;}
        heading.replaceWith(section);
      });
    }
    appendTree(clone,id);appendSources(clone,id);
    const nested=clone.querySelector(".nik-proposals");if(nested)nested.remove();
    detail.append(clone);
  }
  function applyFilters(){
    const q=(document.getElementById("searchCases")?.value||"").trim().toLocaleLowerCase("pl");
    const type=document.getElementById("typeFilter")?.value||"",status=document.getElementById("statusFilter")?.value||"";
    let visible=0;items.forEach(item=>{const ok=(!q||item.button.dataset.search.toLocaleLowerCase("pl").includes(q))&&(!type||item.button.dataset.type===type)&&(!status||item.button.dataset.status===status);item.button.hidden=!ok;if(ok)visible++;});
    count.textContent=visible+" / "+cards.length+" spraw";
    let empty=list.querySelector(".sws-empty");
    if(!visible){if(!empty){empty=document.createElement("p");empty.className="sws-empty";empty.textContent="Nie znaleziono spraw dla wybranych filtrów.";list.append(empty);}detail.textContent="Brak spraw spełniających wybrane kryteria.";return;}
    if(empty)empty.remove();const selected=items.find(x=>x.button.getAttribute("aria-pressed")==="true");
    if(!selected||selected.button.hidden)select(items.find(x=>!x.button.hidden).id);
  }
  fetch("assets/cases/index.json",{credentials:"same-origin"}).then(r=>{if(!r.ok)throw new Error("Rejestr niedostępny");return r.json();}).then(data=>{
    registry=Array.isArray(data.cases)?data.cases:[];
    const topics=(Array.isArray(data.nikTopics)?data.nikTopics:[]).filter(x=>/^NIK-0(?:0[1-9]|1[01])$/.test(x.id)).sort((a,b)=>a.id.localeCompare(b.id,"en"));
    if(topics.length===11)renderNikArchive(topics);
    const active=items.find(x=>x.button.getAttribute("aria-pressed")==="true");if(active)select(active.id);
  }).catch(()=>{const host=document.querySelector("[data-sws-nik-archive]");if(host){const grid=host.querySelector(".sws-nik-archive-grid");if(grid)grid.textContent="Nie udało się wczytać 11 analiz NIK."; }});
  ["searchCases","typeFilter","statusFilter"].forEach(id=>{const el=document.getElementById(id);if(el){el.addEventListener("input",applyFilters);el.addEventListener("change",applyFilters);}});
  source.classList.add("sws-source-hidden");select(items[0].id);applyFilters();
})();
