/* Leon Visual ROM 1.5 — shared 5x2 sprite sheet. */
(() => {
  "use strict";
  const data = [
    ["Fundament państwa","Instytucje i zaufanie","▥","leon-pillar-sprite.webp","#fa3048"],
    ["Gospodarka i rozwój","Inwestycje, przemysł, innowacje","▤","leon-pillar-sprite.webp","#159bff"],
    ["System prawny","Proste i skuteczne prawo","⚖","leon-pillar-sprite.webp","#f5c747"],
    ["Bezpieczeństwo","Odporność państwa i obywateli","⬡","leon-pillar-sprite.webp","#63d77e"],
    ["System emerytalny","Stabilność i godne życie","♧","leon-pillar-sprite.webp","#c76bff"],
    ["Kapitał ludzki","Edukacja, kompetencje, rozwój","◆","leon-pillar-sprite.webp","#27d4e8"],
    ["Zarządzanie strategiczne","Długofalowa polityka państwa","⚙","leon-pillar-sprite.webp","#278cff"],
    ["Odporność informacyjna","Świadome i bezpieczne społeczeństwo","⬡","leon-pillar-sprite.webp","#ed49b6"],
    ["Demografia i stabilność","Rodzina, mieszkalnictwo, regiony","♧","leon-pillar-sprite.webp","#f08a43"],
    ["System finansów państwa","Przejrzystość, efektywność, kontrola","▤","leon-pillar-sprite.webp","#20cda8"]
  ];
  const tiles = Object.fromEntries(data.map((item,index)=>["pillar-"+(index+1),Object.freeze({
    id:"pillar-"+(index+1),asset:item[3],spriteIndex:index,title:item[0],subtitle:item[1],icon:item[2],accent:item[4]
  })]));
  window.LeonVisualROM = Object.freeze({
    id:"model-panstwa-home-reference",version:"1.5.0",deterministic:true,
    hero:Object.freeze({id:"hero",asset:"leon-hero.webp",focal:"center 50%",alt:"Panorama Polski z mapą i flagą"}),
    tiles:Object.freeze(tiles)
  });
})();