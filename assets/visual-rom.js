/* Leon Visual ROM 1.2 — stable photographic-ready mapping; local fallback remains available. */
(() => {
  "use strict";
  const tiles = {
    "pillar-1":  { id:"pillar-1", asset:"leon-filar-01-fundament.svg", focal:"50% 35%", accent:"#fa3048", shade:"strong", scene:"institutions", alt:"Fundament państwa" },
    "pillar-2":  { id:"pillar-2", asset:"leon-filar-02-gospodarka.svg", focal:"50% 35%", accent:"#168cff", shade:"medium", scene:"industry", alt:"Gospodarka i rozwój" },
    "pillar-3":  { id:"pillar-3", asset:"leon-filar-03-prawo.svg", focal:"50% 35%", accent:"#f2c94c", shade:"strong", scene:"justice", alt:"System prawny" },
    "pillar-4":  { id:"pillar-4", asset:"leon-filar-04-bezpieczenstwo.svg", focal:"50% 35%", accent:"#55e879", shade:"medium", scene:"security", alt:"Bezpieczeństwo" },
    "pillar-5":  { id:"pillar-5", asset:"leon-filar-05-emerytury.svg", focal:"50% 35%", accent:"#c66cff", shade:"medium", scene:"senior-life", alt:"System emerytalny" },
    "pillar-6":  { id:"pillar-6", asset:"leon-filar-06-kapital-ludzki.svg", focal:"50% 35%", accent:"#27d4e8", shade:"medium", scene:"education", alt:"Kapitał ludzki" },
    "pillar-7":  { id:"pillar-7", asset:"leon-filar-07-strategia.svg", focal:"50% 35%", accent:"#278cff", shade:"medium", scene:"strategy", alt:"Zarządzanie strategiczne" },
    "pillar-8":  { id:"pillar-8", asset:"leon-filar-08-informacje.svg", focal:"50% 35%", accent:"#ed49b6", shade:"strong", scene:"information-resilience", alt:"Odporność informacyjna" },
    "pillar-9":  { id:"pillar-9", asset:"leon-filar-09-demografia.svg", focal:"50% 35%", accent:"#f08a43", shade:"medium", scene:"family", alt:"Demografia i stabilność" },
    "pillar-10": { id:"pillar-10", asset:"leon-filar-10-finanse.svg", focal:"50% 35%", accent:"#20cda8", shade:"medium", scene:"public-finance", alt:"Finanse państwa" }
  };
  const ROM = {
    id:"model-panstwa-home-reference", version:"1.2.0",
    source:{file:"reference-1536x864",width:1536,height:864,method:"measured-reference"},
    deterministic:true, canvas:{width:1536,height:864,aspect:"16:9"},
    palette:{night:"#001020",deep:"#001030",navy:"#002040",blue:"#103060",text:"#f0f0f0",muted:"#d8e2ef",line:"rgba(161,198,231,.35)",polishWhite:"#fff",polishRed:"#dc143c"},
    composition:{navigation:{top:0,height:66},hero:{top:66,height:225,asset:"polska-hero.webp",fit:"cover",position:"center 54%"},pillars:{columns:5,rows:2,gap:14,ratio:"16:9",order:"1-10"},modules:{columns:4,ratio:"4:1"},footer:{height:78}},
    hero:{id:"hero",asset:"polska-hero.webp",focal:"50% 54%",fit:"cover",alt:"Panorama Polski z mapą i flagą"},
    tiles:Object.freeze(Object.fromEntries(Object.entries(tiles).map(([key,value])=>[key,Object.freeze(value)])))
  };
  window.LeonVisualROM=Object.freeze(ROM);
})();