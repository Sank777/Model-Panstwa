/* Leon Visual ROM 1.3 — one hero + 10 crops from a 5x2 WebP sprite. */
(() => {
  "use strict";
  const names = [
    ["Fundament państwa","#fa3048","strong"],
    ["Gospodarka i rozwój","#168cff","medium"],
    ["System prawny","#f2c94c","strong"],
    ["Bezpieczeństwo","#55e879","medium"],
    ["System emerytalny","#c66cff","medium"],
    ["Kapitał ludzki","#27d4e8","medium"],
    ["Zarządzanie strategiczne","#278cff","medium"],
    ["Odporność informacyjna","#ed49b6","strong"],
    ["Demografia i stabilność","#f08a43","medium"],
    ["System finansów państwa","#20cda8","medium"]
  ];
  const tiles = Object.fromEntries(names.map((item, index) => {
    const n = index + 1;
    return ["pillar-" + n, Object.freeze({
      id:"pillar-" + n, sprite:"leon-pillar-sprite.webp",
      column:index % 5, row:Math.floor(index / 5),
      accent:item[1], shade:item[2], alt:item[0]
    })];
  }));
  window.LeonVisualROM = Object.freeze({
    id:"model-panstwa-home-reference", version:"1.3.0",
    deterministic:true,
    hero:Object.freeze({id:"hero",asset:"leon-hero.webp",focal:"center 54%",alt:"Panorama Polski z mapą i flagą"}),
    sprite:Object.freeze({asset:"leon-pillar-sprite.webp",columns:5,rows:2}),
    tiles:Object.freeze(tiles)
  });
})();