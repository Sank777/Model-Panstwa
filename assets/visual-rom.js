/* Leon Visual ROM 1.1 — measured from the supplied 1536x864 portal reference
   Deterministic layout, palette, focal points and scene assignments. */
(() => {
  "use strict";
  const tiles = {
    "pillar-1":  { asset:"leon-filar-01-fundament.svg", focal:"50% 35%", accent:"#fa3048", shade:"strong", scene:"institutions" },
    "pillar-2":  { asset:"leon-filar-02-gospodarka.svg", focal:"50% 35%", accent:"#168cff", shade:"medium", scene:"industry" },
    "pillar-3":  { asset:"leon-filar-03-prawo.svg", focal:"50% 35%", accent:"#f2c94c", shade:"strong", scene:"justice" },
    "pillar-4":  { asset:"leon-filar-04-bezpieczenstwo.svg", focal:"50% 35%", accent:"#55e879", shade:"medium", scene:"security" },
    "pillar-5":  { asset:"leon-filar-05-emerytury.svg", focal:"50% 35%", accent:"#c66cff", shade:"medium", scene:"senior-life" },
    "pillar-6":  { asset:"leon-filar-06-kapital-ludzki.svg", focal:"50% 35%", accent:"#27d4e8", shade:"medium", scene:"education" },
    "pillar-7":  { asset:"leon-filar-07-strategia.svg", focal:"50% 35%", accent:"#278cff", shade:"medium", scene:"strategy" },
    "pillar-8":  { asset:"leon-filar-08-informacje.svg", focal:"50% 35%", accent:"#ed49b6", shade:"strong", scene:"information-resilience" },
    "pillar-9":  { asset:"leon-filar-09-demografia.svg", focal:"50% 35%", accent:"#f08a43", shade:"medium", scene:"family" },
    "pillar-10": { asset:"leon-filar-10-finanse.svg", focal:"50% 35%", accent:"#20cda8", shade:"medium", scene:"public-finance" }
  };
  const ROM = {
    id:"model-panstwa-home-reference",
    version:"1.1.0",
    source:{file:"reference-1536x864",width:1536,height:864,method:"pixel-sampled-and-measured"},
    deterministic:true,
    canvas:{width:1536,height:864,aspect:"16:9"},
    palette:{
      night:"#001020",deep:"#001030",navy:"#002040",blue:"#103060",
      text:"#f0f0f0",muted:"#d8e2ef",line:"rgba(161,198,231,.35)",
      polishWhite:"#ffffff",polishRed:"#dc143c",
      measuredDominant:["#001020","#001030","#002040","#000020","#f0f0f0"]
    },
    composition:{
      navigation:{top:0,height:66},
      hero:{top:66,height:225,asset:"polska-hero.webp",fit:"cover",position:"center 54%"},
      pillars:{columns:5,rows:2,gap:14,ratio:"16:9",order:"1-10",bounds:{left:17,top:292,right:1518,bottom:661}},
      modules:{columns:4,ratio:"4:1",top:685,height:77},
      footer:{top:786,height:78}
    },
    hero:{
      asset:"polska-hero.webp",focal:"center 54%",fit:"cover",
      overlay:"linear-gradient(90deg,rgba(4,18,34,.14),rgba(4,18,34,.06) 45%,rgba(4,18,34,.16))",
      map:{visible:true,left:"7%",width:"13%",glow:"#65caff"},
      flag:{visible:true,right:"7%",width:"12%",height:95}
    },
    tiles:Object.freeze(Object.fromEntries(Object.entries(tiles).map(([key,value])=>[key,Object.freeze(value)])))
  };
  window.LeonVisualROM=Object.freeze(ROM);
})();
