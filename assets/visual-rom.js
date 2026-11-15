/* Leon Visual ROM 1.6 — verified assets stored in /assets/menu/. */
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
  window.LeonVisualROM = Object.freeze({
    id:"model-panstwa-home-reference",version:"1.7.0",deterministic:true,
    spriteGrid:Object.freeze({columns:5,rows:2}),
    hero:Object.freeze({id:"hero",asset:"menu/leon-hero.webp",focal:"center 50%",alt:"Panorama Polski z mapą i flagą"}),
    tiles:Object.freeze(tiles)
  });
})();
