/* Leon Visual Reference Extractor 5.5 — local-only image analysis.
   Reads user-selected files in-browser. No network, upload, storage or third-party code. */
(() => {
  "use strict";
  const MAX_BYTES = 12 * 1024 * 1024;
  const MAX_SIDE = 8192;
  const GRID_X = 24, GRID_Y = 12, PALETTE_SIZE = 12;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const hex = (r,g,b) => "#" + [r,g,b].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("").toUpperCase();
  const rgbToHsl = (r,g,b) => {
    r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0,s=0,l=(max+min)/2;
    if(d){s=d/(1-Math.abs(2*l-1));switch(max){case r:h=((g-b)/d)%6;break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h*=60;if(h<0)h+=360;}
    return [h,s*100,l*100];
  };
  function analyze(imageData,w,h){
    const data=imageData.data, bins=new Map(), cells=[];
    let rSum=0,gSum=0,bSum=0,lSum=0,sSum=0,edgeSum=0,count=0;
    const sample=(x,y)=>{const i=(y*w+x)*4;return [data[i],data[i+1],data[i+2]];};
    for(let gy=0;gy<GRID_Y;gy++)for(let gx=0;gx<GRID_X;gx++){
      const x0=Math.floor(gx*w/GRID_X),x1=Math.max(x0+1,Math.floor((gx+1)*w/GRID_X));
      const y0=Math.floor(gy*h/GRID_Y),y1=Math.max(y0+1,Math.floor((gy+1)*h/GRID_Y));
      let rr=0,gg=0,bb=0,n=0,edge=0,prev=null;
      const sx=Math.max(1,Math.floor((x1-x0)/8)),sy=Math.max(1,Math.floor((y1-y0)/6));
      for(let y=y0;y<y1;y+=sy)for(let x=x0;x<x1;x+=sx){
        const p=sample(x,y);rr+=p[0];gg+=p[1];bb+=p[2];n++;
        if(prev)edge+=Math.abs(p[0]-prev[0])+Math.abs(p[1]-prev[1])+Math.abs(p[2]-prev[2]);
        prev=p;
      }
      const rgb=[rr/n,gg/n,bb/n],hsl=rgbToHsl(...rgb),avg=hex(...rgb);
      cells.push({x:gx,y:gy,color:avg,luminance:+hsl[2].toFixed(1),saturation:+hsl[1].toFixed(1),edge:+(edge/Math.max(1,n-1)/765).toFixed(3)});
      const key=hex(...rgb);bins.set(key,(bins.get(key)||0)+1);
      rSum+=rgb[0];gSum+=rgb[1];bSum+=rgb[2];lSum+=hsl[2];sSum+=hsl[1];edgeSum+=edge/Math.max(1,n-1)/765;count++;
    }
    const palette=[...bins].sort((a,b)=>b[1]-a[1]).slice(0,PALETTE_SIZE).map(([color,weight])=>({color,share:+(weight/cells.length).toFixed(4)}));
    return {palette,cells,metrics:{meanColor:hex(rSum/count,gSum/count,bSum/count),meanLuminance:+(lSum/count).toFixed(2),meanSaturation:+(sSum/count).toFixed(2),edgeDensity:+(edgeSum/count).toFixed(4)}};
  }
  async function read(file){
    if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error("Wybierz obraz PNG, JPEG lub WebP.");
    if(file.size>MAX_BYTES)throw Error("Plik przekracza limit 12 MB.");
    const bitmap=await createImageBitmap(file);
    try{
      if(bitmap.width>MAX_SIDE||bitmap.height>MAX_SIDE)throw Error("Maksymalny wymiar obrazu to 8192 px.");
      const canvas=document.createElement("canvas");canvas.width=GRID_X;canvas.height=GRID_Y;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      ctx.drawImage(bitmap,0,0,GRID_X,GRID_Y);
      const result=analyze(ctx.getImageData(0,0,GRID_X,GRID_Y),GRID_X,GRID_Y);
      return {schema:"leon-visual-extraction/1.0",engine:"5.5.0",source:{name:file.name,type:file.type,bytes:file.size,width:bitmap.width,height:bitmap.height,aspectRatio:+(bitmap.width/bitmap.height).toFixed(5)},sampling:{grid:[GRID_X,GRID_Y],method:"uniform-cell-average",upload:false},...result};
    }finally{bitmap.close();}
  }
  window.LeonVisualReferenceExtractor=Object.freeze({version:"5.5.0",read});
})();