/* Leon Visual ROM 1.8 — verified assets stored in /assets/menu/. */
(() => {
  "use strict";
  const data = [
    ["Fundament państwa","Instytucje i zaufanie","▥","#fa3048"],
    ["Gospodarka i rozwój","Inwestycje, przemysł, innowacje","▤","#159bff"],
    ["System prawny","Proste i skuteczne prawo","⚖","#f5c747"],
    ["Bezpieczeństwo","Odporność państwa i obywateli","⬡","#63d77e"],
    ["System emerytalny","Stabilność i godne życie","♧","#c76bff"],
    ["Kapitał ludzki","Edukacja, kompetencje, rozwój","◆","#27d4e8"],
    ["Zarządzanie strategiczne","Długofalowa polityka państwa","⚙","#278cff"],
    ["Odporność informacyjna","Świadome i bezpieczne społeczeństwo","⬡","#ed49b6"],
    ["Demografia i stabilność","Rodzina, mieszkalnictwo, regiony","♧","#f08a43"],
    ["System finansów państwa","Przejrzystość, efektywność, kontrola","▤","#20cda8"]
  ];
  const tiles = Object.fromEntries(data.map((item,index)=>["pillar-"+(index+1),Object.freeze({
    id:"pillar-"+(index+1),asset:"menu/leon-pillar-sprite.webp",spriteIndex:index,
    title:item[0],subtitle:item[1],icon:item[2],accent:item[3]
  })]));
  const caseData = [
    ["bridge", "assets/cases/case-atlas.webp", 0, "Inspekcja mostu i dokumentacji technicznej"],
    ["road", "assets/cases/case-atlas.webp", 1, "Prace drogowe i kontrola wykonania inwestycji"],
    ["municipal-finance", "assets/cases/case-atlas.webp", 2, "Analiza budżetu i dokumentów finansowych samorządu"],
    ["public-information", "assets/cases/case-atlas.webp", 3, "Obywatel uzyskuje dostęp do dokumentów publicznych"],
    ["procurement", "assets/cases/case-atlas.webp", 4, "Zespół analizuje dokumentację zamówienia publicznego"],
    ["public-finance", "assets/cases/case-atlas.webp", 5, "Kontrola sprawozdawczości i wydatków publicznych"],
    ["good-practice", "assets/cases/case-atlas.webp", 6, "Elektroniczna platforma zakupowa i porównanie ofert"],
    ["citizen-report", "assets/cases/case-atlas.webp", 7, "Obywatel składa dokumenty w punkcie obsługi"],
    ["diplomatic-decision", "assets/cases/case-atlas.webp", 8, "Zespół analizuje warianty decyzji w sali narad"]
  ];
  const cases = Object.fromEntries(caseData.map(([id,asset,spriteIndex,alt]) => [id,Object.freeze({
    id,asset,spriteIndex,mode:"grid",grid:Object.freeze({columns:3,rows:3,padding:0,gapX:0,gapY:0}),
    alt,fit:"cover",focal:"center 50%"
  })]));
  window.LeonVisualROM = Object.freeze({
    id:"model-panstwa-home-reference",version:"1.9.0",deterministic:true,
    spriteGrid:Object.freeze({columns:5,rows:2,padding:24,gapX:16,gapY:16}),
    hero:Object.freeze({id:"hero",asset:"menu/leon-hero.webp",focal:"center 50%",alt:"Panorama Polski z mapą i flagą"}),
    tiles:Object.freeze(tiles),cases:Object.freeze(cases)
  });
})();
