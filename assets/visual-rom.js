/* Leon Visual ROM 1.4 — independent clean artwork per pillar. */
(() => {
  "use strict";
  const data = [
    ["Fundament państwa","Instytucje i zaufanie","▥","leon-filar-01-fundament.svg","#fa3048"],
    ["Gospodarka i rozwój","Inwestycje, przemysł, innowacje","▤","leon-filar-02-gospodarka.svg","#159bff"],
    ["System prawny","Proste i skuteczne prawo","⚖","leon-filar-03-prawo.svg","#f5c747"],
    ["Bezpieczeństwo","Odporność państwa i obywateli","⬡","leon-filar-04-bezpieczenstwo.svg","#63d77e"],
    ["System emerytalny","Stabilność i godne życie","♧","leon-filar-05-emerytury.svg","#c76bff"],
    ["Kapitał ludzki","Edukacja, kompetencje, rozwój","◆","leon-filar-06-kapital-ludzki.svg","#27d4e8"],
    ["Zarządzanie strategiczne","Długofalowa polityka państwa","⚙","leon-filar-07-strategia.svg","#278cff"],
    ["Odporność informacyjna","Świadome i bezpieczne społeczeństwo","⬡","leon-filar-08-informacje.svg","#ed49b6"],
    ["Demografia i stabilność","Rodzina, mieszkalnictwo, regiony","♧","leon-filar-09-demografia.svg","#f08a43"],
    ["System finansów państwa","Przejrzystość, efektywność, kontrola","▤","leon-filar-10-finanse.svg","#20cda8"]
  ];
  const tiles = Object.fromEntries(data.map((item,index)=>["pillar-"+(index+1),Object.freeze({
    id:"pillar-"+(index+1),asset:item[3],title:item[0],subtitle:item[1],icon:item[2],accent:item[4]
  })]));
  window.LeonVisualROM = Object.freeze({
    id:"model-panstwa-home-reference",version:"1.4.0",deterministic:true,
    hero:Object.freeze({id:"hero",asset:"leon-hero.webp",focal:"center 50%",alt:"Panorama Polski z mapą i flagą"}),
    tiles:Object.freeze(tiles)
  });
})();