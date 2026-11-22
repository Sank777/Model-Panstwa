/* SWS — wspólny przegląd kart; treść pochodzi z istniejących kart biblioteki. */
(() => {
  "use strict";
  const root=document.getElementById("sws-workspace");
  const source=document.getElementById("caseGrid");
  if(!root||!source)return;
  const list=root.querySelector("[data-sws-list]");
  const detail=root.querySelector("[data-sws-detail]");
  const count=root.querySelector("[data-sws-count]");
  const cards=[...source.querySelectorAll('article[id^="case-sws-pl-"]')];
  if(!cards.length)return;

  const items=cards.map(card=>{
    const id=card.id.replace("case-","");
    const title=card.querySelector("h2")?.textContent?.trim()||id;
    const status=card.querySelector(".case-badge")?.textContent?.trim()||"Status w karcie";
    const button=document.createElement("button");
    button.type="button";
    button.className="sws-topic";
    button.dataset.swsId=id;
    button.dataset.type=card.dataset.type||"";
    button.dataset.status=card.dataset.status||"";
    button.dataset.search=(card.dataset.search||"")+" "+card.textContent;
    button.setAttribute("aria-pressed","false");
    const code=document.createElement("span");
    code.className="sws-topic-id";
    code.textContent=id.replace("SWS-PL-","");
    const copy=document.createElement("span");
    const strong=document.createElement("strong");strong.textContent=title;
    const small=document.createElement("small");small.textContent=status;
    copy.append(strong,small);button.append(code,copy);
    button.addEventListener("click",()=>select(id));
    list.append(button);
    return {id,card,button};
  });
  count.textContent=cards.length+" spraw";

  function select(id){
    const item=items.find(x=>x.id===id);
    if(!item)return;
    items.forEach(x=>x.button.setAttribute("aria-pressed",x.id===id?"true":"false"));
    detail.replaceChildren();
    const clone=item.card.cloneNode(true);
    clone.removeAttribute("id");
    clone.removeAttribute("data-search");
    clone.classList.add("sws-selected-card");
    clone.querySelectorAll("[id]").forEach(node=>node.removeAttribute("id"));
    clone.querySelectorAll("details").forEach(node=>node.open=true);
    const body=clone.querySelector(".case-detail");
    if(body){
      const headings=[...body.querySelectorAll(":scope > h3")];
      headings.forEach((heading,index)=>{
        const section=document.createElement("section");
        section.className="sws-analysis-block";
        const title=document.createElement("h3");
        const labels=["USTALENIA I MATERIAŁY","POWIĄZANIA I PRZEBIEG SPRAWY","GRANICE WNIOSKÓW I LEKCJE"];
        title.textContent=labels[Math.min(index,2)];
        const sourceHeading=heading.cloneNode(true);
        sourceHeading.className="sws-source-heading";
        section.append(title,sourceHeading);
        let node=heading.nextSibling;
        while(node && !(node.nodeType===1 && node.tagName==="H3")){
          const next=node.nextSibling;
          section.append(node);
          node=next;
        }
        heading.replaceWith(section);
      });
    }
    const nested=clone.querySelector(".nik-proposals");
    if(nested){
      nested.remove();
      const link=document.createElement("a");
      link.className="sws-nik-link";
      link.href="analizy-nik.html";
      link.textContent="Przejdź do osobnego panelu 11 analiz NIK →";
      clone.append(link);
    }
    detail.append(clone);
  }

  function applyFilters(){
    const q=(document.getElementById("searchCases")?.value||"").trim().toLocaleLowerCase("pl");
    const type=document.getElementById("typeFilter")?.value||"";
    const status=document.getElementById("statusFilter")?.value||"";
    let visible=0;
    items.forEach(item=>{
      const ok=(!q||item.button.dataset.search.toLocaleLowerCase("pl").includes(q))&&
        (!type||item.button.dataset.type===type)&&(!status||item.button.dataset.status===status);
      item.button.hidden=!ok;
      if(ok)visible++;
    });
    count.textContent=visible+" / "+cards.length+" spraw";
    const selected=items.find(x=>x.button.getAttribute("aria-pressed")==="true");
    if(!selected||selected.button.hidden){
      const first=items.find(x=>!x.button.hidden);
      if(first)select(first.id);else detail.replaceChildren();
    }
  }
  ["searchCases","typeFilter","statusFilter"].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.addEventListener("input",applyFilters);el.addEventListener("change",applyFilters);}
  });
  source.classList.add("sws-source-hidden");
  select(items[0].id);
  applyFilters();
})();
