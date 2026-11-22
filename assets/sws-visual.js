/* SWS — wspólny przegląd kart; treść pochodzi z istniejących kart biblioteki. */
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

  let nikTopics=[];
  const items=cards.map(card=>{
    const id=card.querySelector(".case-id")?.textContent?.match(/SWS-PL-\d{3}/)?.[0]||card.id.replace("case-","");
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
    if(id==="SWS-PL-008")button.setAttribute("aria-expanded","false");
    const code=document.createElement("span");
    code.className="sws-topic-id";
    code.textContent=id.replace("SWS-PL-","");
    const copy=document.createElement("span");
    const strong=document.createElement("strong");strong.textContent=title;
    const small=document.createElement("small");small.textContent=status;
    copy.append(strong,small);button.append(code,copy);
    const item={id,card,button,nikList:null};
    button.addEventListener("click",()=>{
      select(id);
      if(id==="SWS-PL-008")toggleNikList(item);
    });
    list.append(button);
    return item;
  });
  count.textContent=cards.length+" spraw";

  function toggleNikList(item){
    if(!item.nikList)return;
    const opening=item.nikList.hidden;
    item.nikList.hidden=!opening;
    item.button.setAttribute("aria-expanded",opening?"true":"false");
  }

  function renderNikList(topics){
    const item=items.find(x=>x.id==="SWS-PL-008");
    if(!item)return;
    const panel=document.createElement("div");
    panel.className="sws-nik-sublist";
    panel.hidden=true;
    const heading=document.createElement("strong");
    heading.className="sws-nik-sublist-title";
    heading.textContent="11 przykładów z analiz NIK";
    panel.append(heading);
    topics.forEach((topic,index)=>{
      const link=document.createElement("a");
      link.className="sws-nik-subtopic";
      link.href="analizy-nik.html?topic="+encodeURIComponent(topic.id);
      const number=document.createElement("span");
      number.className="sws-nik-subtopic-number";
      number.textContent=String(index+1).padStart(2,"0");
      const title=document.createElement("span");
      title.textContent=topic.title||topic.id;
      link.append(number,title);
      panel.append(link);
    });
    item.button.insertAdjacentElement("afterend",panel);
    item.nikList=panel;
  }

  fetch("assets/cases/index.json",{credentials:"same-origin"})
    .then(response=>{if(!response.ok)throw new Error("Nie udało się pobrać rejestru NIK.");return response.json();})
    .then(data=>{
      nikTopics=(Array.isArray(data.nikTopics)?data.nikTopics:[])
        .filter(topic=>/^NIK-0(?:0[1-9]|1[01])$/.test(topic.id))
        .sort((a,b)=>a.id.localeCompare(b.id,"en"));
      if(nikTopics.length!==11)throw new Error("Rejestr nie zawiera kompletu 11 tematów.");
      renderNikList(nikTopics);
      const selected=items.find(x=>x.button.getAttribute("aria-pressed")==="true");
      if(selected?.id==="SWS-PL-008"){
        selected.nikList.hidden=false;
        selected.button.setAttribute("aria-expanded","true");
      }
    })
    .catch(()=>{
      const item=items.find(x=>x.id==="SWS-PL-008");
      if(!item)return;
      const panel=document.createElement("p");
      panel.className="sws-empty sws-nik-sublist";
      panel.hidden=true;
      panel.textContent="Nie udało się wczytać 11 przykładów. Spróbuj ponownie później.";
      item.button.insertAdjacentElement("afterend",panel);
      item.nikList=panel;
    });

  function select(id){
    const item=items.find(x=>x.id===id);
    if(!item)return;
    items.forEach(x=>{
      x.button.setAttribute("aria-pressed",x.id===id?"true":"false");
      if(x.id!=="SWS-PL-008"&&x.nikList){x.nikList.hidden=true;x.button.setAttribute("aria-expanded","false");}
    });
    detail.replaceChildren();
    const clone=item.card.cloneNode(true);
    clone.removeAttribute("id");
    clone.removeAttribute("data-search");
    clone.classList.add("sws-selected-card");
    clone.querySelectorAll("[id]").forEach(node=>node.removeAttribute("id"));
    clone.querySelectorAll("details").forEach(node=>node.open=true);
    const body=clone.querySelector(".case-detail");
    if(body){
      const sourceLinks=body.querySelector(":scope > .case-links");
      if(sourceLinks)sourceLinks.remove();
      const headings=[...body.querySelectorAll(":scope > h3")];
      headings.forEach((heading,index)=>{
        const section=document.createElement("section");
        section.className="sws-analysis-block";
        const title=document.createElement("h3");
        const headingText=heading.textContent.trim().toLocaleLowerCase("pl");
        if(/powiązan|przebieg|testujemy/.test(headingText)) title.textContent="POWIĄZANIA I PRZEBIEG SPRAWY";
        else if(/granice|wywniosk|prawo do wyjaśnień|uwaga prawna|ograniczen/.test(headingText)) title.textContent="GRANICE WNIOSKÓW I WYJAŚNIENIA";
        else if(/pytan|edukacyjn|lekcj|wniosek|co powinien/.test(headingText)) title.textContent="PYTANIA KONTROLNE I LEKCJE";
        else title.textContent="USTALENIA I MATERIAŁY";
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
      if(sourceLinks){
        const sourceSection=document.createElement("section");
        sourceSection.className="sws-analysis-block sws-sources";
        const sourceTitle=document.createElement("h3");
        sourceTitle.textContent="ŹRÓDŁA I DOKUMENTY";
        sourceSection.append(sourceTitle,sourceLinks);
        body.append(sourceSection);
      }
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
      if(item.nikList)item.nikList.hidden=!ok||item.nikList.hidden;
      if(ok)visible++;
    });
    count.textContent=visible+" / "+cards.length+" spraw";
    let emptyMessage=list.querySelector(".sws-empty");
    if(visible===0){
      if(!emptyMessage){
        emptyMessage=document.createElement("p");
        emptyMessage.className="sws-empty";
        emptyMessage.textContent="Nie znaleziono spraw SWS dla wybranych filtrów. Zmień hasło lub wyczyść filtry.";
        list.append(emptyMessage);
      }
      detail.replaceChildren();
      const notice=document.createElement("p");
      notice.className="sws-empty";
      notice.textContent="Brak spraw spełniających wybrane kryteria.";
      detail.append(notice);
      return;
    }
    if(emptyMessage)emptyMessage.remove();
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
