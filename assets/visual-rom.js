/* Leon Visual ROM 1.0
   Stała receptura wzorca strony Model Państwa.
   Dane deterministyczne: brak losowości, sieci i zewnętrznego generatora.
   Fotografie pozostają lokalnymi zasobami; ROM przechowuje ich układ i parametry. */
(() => {
  "use strict";
  const tiles = {
    "pillar-1":  { asset:"leon-filar-01-fundament.svg", focal:"50% 50%", accent:"#fa3048", shade:"strong", scene:"institutions" },
    "pillar-2":  { asset:"leon-filar-02-gospodarka.svg", focal:"50% 50%", accent:"#168cff", shade:"medium", scene:"industry" },
    "pillar-3":  { asset:"leon-filar-03-prawo.svg", focal:"50% 50%", accent:"#f2c94c", shade:"strong", scene:"justice" },
    "pillar-4":  { asset:"leon-filar-04-bezpieczenstwo.svg", focal:"50% 50%", accent:"#55d88a", shade:"medium", scene:"security" },
    "pillar-5":  { asset:"leon-filar-05-emerytury.svg", focal:"50% 50%", accent:"#c66cff", shade:"medium", scene:"senior-life" },
    "pillar-6":  { asset:"leon-filar-06-kapital-ludzki.svg", focal:"50% 50%", accent:"#27d4e8", shade:"medium", scene:"education" },
    "pillar-7":  { asset:"leon-filar-07-strategia.svg", focal:"50% 50%", accent:"#278cff", shade:"medium", scene:"strategy" },
    "pillar-8":  { asset:"leon-filar-08-informacje.svg", focal:"50% 50%", accent:"#ed49b6", shade:"strong", scene:"information-resilience" },
    "pillar-9":  { asset:"leon-filar-09-demografia.svg", focal:"50% 50%", accent:"#f08a43", shade:"medium", scene:"family" },
    "pillar-10": { asset:"leon-filar-10-finanse.svg", focal:"50% 50%", accent:"#20cda8", shade:"medium", scene:"public-finance" }
  };
  const ROM = {
    id:"model-panstwa-home-reference",
    version:"1.0.0",
    source:"user-approved-reference",
    deterministic:true,
    canvas:{width:1536,height:1024,aspect:"3:2"},
    palette:{
      night:"#06182c", navy:"#0d2743", text:"#f5f8fc",
      muted:"#d1dce9", line:"rgba(161,198,231,.35)",
      polishWhite:"#ffffff", polishRed:"#dc143c"
    },
    composition:{
      navigation:{top:0,height:66},
      hero:{top:66,height:225,asset:"polska-hero.webp",fit:"cover",position:"center 54%"},
      pillars:{columns:5,rows:2,gap:14,ratio:"16:9",order:"1-10"},
      modules:{columns:4,ratio:"4:1"},
      footer:{height:78}
    },
    hero:{
      asset:"polska-hero.webp",focal:"center 54%",fit:"cover",
      overlay:"linear-gradient(90deg,rgba(4,20,39,.22),rgba(4,20,39,.04) 55%,rgba(4,20,39,.12))"
    },
    tiles:Object.freeze(Object.fromEntries(Object.entries(tiles).map(([key,value])=>[key,Object.freeze(value)])))
  };
  window.LeonVisualROM=Object.freeze(ROM);
})();
