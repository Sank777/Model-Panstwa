/* Leon Visual ROM 1.9 — independent artwork per pillar; no atlas dependency. */
(() => {
  "use strict";
  const data = [
    ["Fundament państwa","Instytucje i zaufanie","▥","#fa3048","leon-filar-01-fundament.svg"],
    ["Gospodarka i rozwój","Inwestycje, przemysł, innowacje","▤","#159bff","leon-filar-02-gospodarka.svg"],
    ["System prawny","Proste i skuteczne prawo","⚖","#f5c747","leon-filar-03-prawo.svg"],
    ["Bezpieczeństwo","Odporność państwa i obywateli","⬡","#63d77e","leon-filar-04-bezpieczenstwo.svg"],
    ["System emerytalny","Stabilność i godne życie","♧","#c76bff","leon-filar-05-emerytury.svg"],
    ["Kapitał ludzki","Edukacja, kompetencje, rozwój","◆","#27d4e8","leon-filar-06-kapital-ludzki.svg"],
    ["Zarządzanie strategiczne","Długofalowa polityka państwa","⚙","#278cff","leon-filar-07-strategia.svg"],
    ["Odporność informacyjna","Świadome i bezpieczne społeczeństwo","⬡","#ed49b6","leon-filar-08-informacje.svg"],
    ["Demografia i stabilność","Rodzina, mieszkalnictwo, regiony","♧","#f08a43","leon-filar-09-demografia.svg"],
    ["System finansów państwa","Przejrzystość, efektywność, kontrola","▤","#20cda8","leon-filar-10-finanse.svg"]
  ];
  const tiles = Object.fromEntries(data.map((item,index)=>["pillar-"+(index+1),Object.freeze({
    id:"pillar-"+(index+1),asset:"menu/"+item[4],mode:"single",
    title:item[0],subtitle:item[1],icon:item[2],accent:item[3]
  })]));
  window.LeonVisualROM = Object.freeze({
    id:"model-panstwa-home-reference",version:"1.9.0",deterministic:true,
    hero:Object.freeze({id:"hero",asset:"menu/leon-hero.webp",focal:"center 50%",alt:"Panorama Polski z mapą i flagą"}),
    tiles:Object.freeze(tiles)
  });
})();
