/* Leon Visual ROM 1.2 — photographic scene mapping and responsive reference layout. */
(() => {
  "use strict";
  const tiles = {
    "pillar-1":  { id:"pillar-1", asset:"filar-1-fundament.webp", focal:"50% 48%", accent:"#fa3048", shade:"strong", alt:"Gmach instytucji publicznej z polskimi flagami" },
    "pillar-2":  { id:"pillar-2", asset:"filar-2-gospodarka.webp", focal:"50% 50%", accent:"#168cff", shade:"medium", alt:"Robot przemysłowy na hali produkcyjnej" },
    "pillar-3":  { id:"pillar-3", asset:"filar-3-prawo.webp", focal:"50% 48%", accent:"#f2c94c", shade:"strong", alt:"Waga sprawiedliwości na tle ksiąg prawnych" },
    "pillar-4":  { id:"pillar-4", asset:"filar-4-bezpieczenstwo.webp", focal:"50% 48%", accent:"#55e879", shade:"medium", alt:"Żołnierz w polskim umundurowaniu i samoloty" },
    "pillar-5":  { id:"pillar-5", asset:"filar-5-emerytury.webp", focal:"50% 50%", accent:"#c66cff", shade:"medium", alt:"Starsza para spacerująca w parku" },
    "pillar-6":  { id:"pillar-6", asset:"filar-6-kapital-ludzki.webp", focal:"50% 50%", accent:"#27d4e8", shade:"medium", alt:"Biret absolwencki na książkach" },
    "pillar-7":  { id:"pillar-7", asset:"filar-7-strategia.webp", focal:"50% 50%", accent:"#278cff", shade:"medium", alt:"Analityk przed ekranami z danymi i mapą Polski" },
    "pillar-8":  { id:"pillar-8", asset:"filar-8-odpornosc-informacyjna.webp", focal:"50% 50%", accent:"#ed49b6", shade:"strong", alt:"Ekran cyberbezpieczeństwa z symbolem ochrony" },
    "pillar-9":  { id:"pillar-9", asset:"filar-9-demografia.webp", focal:"50% 50%", accent:"#f08a43", shade:"medium", alt:"Rodzina idąca razem o zachodzie słońca" },
    "pillar-10": { id:"pillar-10", asset:"filar-10-finanse.webp", focal:"50% 50%", accent:"#20cda8", shade:"medium", alt:"Monety i rosnący wykres finansowy" }
  };
  const ROM = {
    id:"model-panstwa-home-reference", version:"1.2.0",
    source:{file:"reference-1536x864",width:1536,height:864,method:"measured-reference-and-photographic-assets"},
    deterministic:true, canvas:{width:1536,height:864,aspect:"16:9"},
    palette:{night:"#001020",deep:"#001030",navy:"#002040",blue:"#103060",text:"#f0f0f0",muted:"#d8e2ef",line:"rgba(161,198,231,.35)",polishWhite:"#fff",polishRed:"#dc143c"},
    composition:{
      navigation:{top:0,height:66},
      hero:{top:66,height:225,asset:"polska-hero.webp",fit:"cover",position:"center 54%"},
      pillars:{columns:5,rows:2,gap:14,ratio:"16:9",order:"1-10"},
      modules:{columns:4,ratio:"4:1"}, footer:{height:78}
    },
    hero:{id:"hero",asset:"polska-hero.webp",focal:"center 54%",fit:"cover",alt:"Panorama polskiego krajobrazu z mapą Polski i flagą"},
    tiles:Object.freeze(Object.fromEntries(Object.entries(tiles).map(([key,value])=>[key,Object.freeze(value)])))
  };
  window.LeonVisualROM=Object.freeze(ROM);
})();