import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ORIGIN="https://sank777.github.io", BUCKET="visual-assets", LIMIT=5*1024*1024;
const CORS={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
const SCENES:Record<string,{title:string;scene:string;accent:string}>={
"1":{title:"Fundament państwa",scene:"Photorealistic modern public policy situation room in Poland; a small diverse team of analysts seen from behind studying a large wall display with abstract charts and a subtle map silhouette of Poland.",accent:"cool blue with restrained red"},
"2":{title:"Gospodarka i rozwój",scene:"Photorealistic Polish advanced factory and logistics environment; modern manufacturing equipment, engineers in the middle distance, daylight.",accent:"steel blue and cyan"},
"3":{title:"System prawny",scene:"Photorealistic balanced justice scales and a closed legal volume on a dark wood desk in a contemporary institutional setting; soft directional light.",accent:"muted gold"},
"4":{title:"Bezpieczeństwo",scene:"Photorealistic emergency response coordination; responders in the distance, civilian infrastructure and calm operations centre; no weapons.",accent:"teal green"},
"5":{title:"System emerytalny",scene:"Photorealistic editorial still life of retirement planning; hands reviewing neutral financial papers beside a modest stack of coins, calculator and glasses.",accent:"violet and silver"},
"6":{title:"Kapitał ludzki",scene:"Photorealistic modern Polish classroom or technical workshop; learners collaborating on a practical project.",accent:"mint green"},
"7":{title:"Zarządzanie strategiczne",scene:"Photorealistic strategic planning workshop; team around a table, long-term roadmap on a large screen with abstract charts.",accent:"blue and amber"},
"8":{title:"Odporność informacyjna",scene:"Photorealistic fact-checking desk; analyst comparing printed documents and laptop with abstract unreadable information panels, magnifying glass.",accent:"magenta and cool blue"},
"9":{title:"Demografia i stabilność",scene:"Photorealistic Polish neighbourhood; families across generations in a green public space, contemporary housing and community life.",accent:"soft amber and green"},
"10":{title:"System finansów państwa",scene:"Photorealistic public finance oversight desk; budget papers, calculator and laptop with abstract financial charts.",accent:"turquoise and deep blue"}};
function reply(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...CORS,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
function promptFor(s:{title:string;scene:string;accent:string},detail:string){return [
"Create one premium photorealistic editorial photograph for a Polish civic strategy website card.",
"Subject: "+s.title+". "+s.scene,
detail? "Additional scene detail, subordinate to all fixed rules: "+detail:"",
"FIXED STYLE: credible documentary photography; deep navy and slate-blue environment; subtle accent: "+s.accent+"; soft realistic directional light; natural materials; believable human proportions; serious, trustworthy public-institution aesthetic.",
"COMPOSITION: landscape 3:2; medium-wide framing; one clear focal subject; quiet dark negative space in lower 25 percent for separate HTML text overlay; subject remains clear in a small card; realistic depth of field.",
"STRICT: no words, letters, numbers, logos, watermarks, flags, UI mockups, borders, frames, icons, vector art, collage or surreal elements. Do not render text; all text and decoration are HTML/CSS.",
"All ten images share the same photographic language, lighting logic, navy tonal base and framing discipline; only the pillar subject changes."
].filter(Boolean).join("\n")}
Deno.serve(async(req:Request)=>{
const origin=req.headers.get("origin"); if(origin&&origin!==ORIGIN)return reply({error:"Forbidden origin"},403);
if(req.method==="OPTIONS")return new Response("ok",{headers:CORS}); if(req.method!=="POST")return reply({error:"Method not allowed"},405);
const token=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]; if(!token)return reply({error:"Authentication required"},401);
const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),api=Deno.env.get("OPENAI_API_KEY");
if(!url||!anon||!service||!api)return reply({error:"Server configuration incomplete; required secrets are missing"},503);
const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await auth.auth.getUser(token),user=data?.user;if(error||!user)return reply({error:"Invalid session"},401);
const role=user.app_metadata?.role,scopes=Array.isArray(user.app_metadata?.admin_modules)?user.app_metadata.admin_modules:[];
if(!(role==="admin"||(role==="site_admin"&&scopes.includes("visual-assets"))))return reply({error:"Visual engine administrator access required"},403);
const raw=await req.text();if(raw.length>4096)return reply({error:"Request too large"},413);
let body:Record<string,unknown>;try{body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))throw 0}catch{return reply({error:"Invalid JSON"},400)}
const id=String(body.pillar_id??""),scene=SCENES[id];if(!scene)return reply({error:"pillar_id must be 1..10"},400);
const detail=typeof body.scene_detail==="string"?body.scene_detail.trim():"";if(detail.length>500)return reply({error:"scene_detail max 500 characters"},400);
const model=Deno.env.get("OPENAI_IMAGE_MODEL")||"gpt-image-2.5-flare";
const generated=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{"Authorization":"Bearer "+api,"Content-Type":"application/json"},body:JSON.stringify({model,prompt:promptFor(scene,detail),n:1,size:"1536x1024",quality:"high",output_format:"webp",output_compression:82,moderation:"auto"})});
if(!generated.ok){console.error("Image API",generated.status,(await generated.text()).slice(0,1000));return reply({error:"Image generation failed",provider_status:generated.status},502)}
const payload=await generated.json(),b64=payload?.data?.[0]?.b64_json;if(typeof b64!=="string")return reply({error:"Provider returned no image"},502);
const bytes=Uint8Array.from(atob(b64),(c)=>c.charCodeAt(0));if(bytes.byteLength>LIMIT)return reply({error:"Image exceeds 5 MB"},413);
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const check=await fetch(url+"/storage/v1/bucket/"+BUCKET,{headers:{Authorization:"Bearer "+service,apikey:service}});
if(check.status===404){const created=await fetch(url+"/storage/v1/bucket",{method:"POST",headers:{Authorization:"Bearer "+service,apikey:service,"Content-Type":"application/json"},body:JSON.stringify({id:BUCKET,name:BUCKET,public:true,file_size_limit:LIMIT,allowed_mime_types:["image/webp"]})});if(!created.ok&&created.status!==409){console.error("Bucket create",created.status);return reply({error:"Storage initialization failed"},500)}}else if(!check.ok)return reply({error:"Storage verification failed"},500);
const path="pillar-"+id+"/"+new Date().toISOString().replace(/[:.]/g,"-")+"-"+crypto.randomUUID()+".webp";
const {error:uploadError}=await admin.storage.from(BUCKET).upload(path,bytes,{contentType:"image/webp",cacheControl:"31536000",upsert:false});
if(uploadError){console.error("Upload",uploadError.message);return reply({error:"Could not save generated image"},500)}
const {data:publicData}=admin.storage.from(BUCKET).getPublicUrl(path);
return reply({ok:true,pillar_id:id,pillar:scene.title,model,format:"webp",width:1536,height:1024,bytes:bytes.byteLength,path,public_url:publicData.publicUrl,prompt_version:"visual-rules-v1"},201);
});