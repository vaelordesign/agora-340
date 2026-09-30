
// ------------------------------------------------------------------
// Entraînement à la dissertation : sujet, chrono, brouillon, autocorrection.
// Les sujets et plans sont lus dans le HTML (#view-dissert .plan).
// ------------------------------------------------------------------
(function(){
const KEY='agora-340-dissert';
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));
const root=$('#view-dissert'); if(!root) return;
let st=load();
function load(){ try{ const s=JSON.parse(localStorage.getItem(KEY)||'{}'); return {drafts:s.drafts||{},done:s.done||[]}; }catch(e){ return {drafts:{},done:[]}; } }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(st)); }catch(e){} }
const PLANS=$$('.plan',root).filter(p=>p.id).map(p=>{ const theme=p.closest('.dtheme'); return {id:p.id, q:$('b.t',p).textContent.trim(), theme:theme?$('.dth-title',theme).textContent.replace(/^Thème \d+ · /,'').trim():'', html:p.innerHTML}; });
const sel=$('#d-select'); PLANS.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.q; sel.appendChild(o); });
let mode='plan';
$$('#d-setup .chip').forEach(c=>c.addEventListener('click',()=>{ $$('#d-setup .chip').forEach(x=>x.setAttribute('aria-pressed','false')); c.setAttribute('aria-pressed','true'); mode=c.getAttribute('data-dm'); }));
function hist(){ const n=st.done.length; $('#d-hist').textContent=n?n+' sujet'+(n>1?'s':'')+' déjà travaillé'+(n>1?'s':'')+' sur cet appareil':''; }
hist();
let timer=null;
$('#d-start').addEventListener('click',()=>{
  let id=sel.value; if(!id){ const rest=PLANS.filter(p=>st.done.indexOf(p.id)<0); const pool=rest.length?rest:PLANS; id=pool[Math.floor(Math.random()*pool.length)].id; }
  start(PLANS.find(p=>p.id===id));
});
function fmt(s){ const m=Math.floor(s/60); s=s%60; return (m<10?'0':'')+m+':'+(s<10?'0':'')+s; }
function start(p){
  const limit=mode==='plan'?10*60:60*60;
  const work=$('#d-work'); work.hidden=false; $('#d-setup').hidden=true;
  work.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">'+(mode==='plan'?'Plan en 10 minutes':'Texte complet en 60 minutes')+' · '+p.theme+'</span><span class="timer" id="d-timer">'+fmt(limit)+'</span></div>'+
    '<div class="qtext">'+p.q+'</div>'+
    '<p class="stat-line" style="margin:0 0 10px">'+(mode==='plan'?'Écris ta position en une phrase, ton argument en trois lignes avec un exemple et un philosophe, puis l\'objection et la réfutation en deux lignes chacune.':'Rédige le texte au complet : introduction en trois temps, thèse, objection, réfutation, conclusion. Vise 400 à 500 mots.')+'</p>'+
    '<textarea id="d-text" placeholder="Ton brouillon reste sur cet appareil.">'+(st.drafts[p.id]||'').replace(/</g,'&lt;')+'</textarea><div class="dwords" id="d-words"></div>'+
    '<div class="row" style="margin-top:12px"><button type="button" class="btn primary" id="d-check">J\'ai fini, je me corrige</button><button type="button" class="btn ghost" id="d-quit">Abandonner</button></div>'+
    '<div id="d-result" hidden></div></div>';
  const ta=$('#d-text'); const words=()=>{ const n=(ta.value.trim().match(/\S+/g)||[]).length; $('#d-words').textContent=n+' mot'+(n>1?'s':''); };
  words(); ta.addEventListener('input',()=>{ st.drafts[p.id]=ta.value; save(); words(); });
  const t0=Date.now(); const tm=$('#d-timer');
  if(timer) clearInterval(timer);
  timer=setInterval(()=>{ const left=limit-Math.floor((Date.now()-t0)/1000); tm.textContent=fmt(Math.max(0,left)); tm.classList.toggle('low',left<=5*60); if(left<=0){ clearInterval(timer); timer=null; } },1000);
  $('#d-quit').addEventListener('click',()=>{ if(timer){ clearInterval(timer); timer=null; } work.hidden=true; $('#d-setup').hidden=false; });
  $('#d-check').addEventListener('click',()=>{ if(timer){ clearInterval(timer); timer=null; } showResult(p); });
  work.scrollIntoView({block:'start'});
}
const CHECK=[
  'Ma position tient en une phrase claire, dès le début de la thèse (« Je soutiens que… »).',
  'Mon argument est expliqué en plusieurs phrases enchaînées (car, donc, autrement dit), pas énuméré.',
  'J\'ai défini au moins un concept du cours (vertu-science, convention, doxa, justice…).',
  'J\'ai donné un exemple concret et je l\'ai relié à ma thèse.',
  'J\'ai nommé au moins un philosophe avec son idée exacte.',
  'Mon objection est la meilleure position adverse, attribuée à un philosophe, avec son raisonnement.',
  'Ma réfutation répond vraiment à l\'objection (prémisse fausse, conséquence absurde ou contre-exemple) et revient à la thèse.',
  'Introduction en trois temps (amené, posé, divisé) et conclusion de deux phrases.',
  'Aucun point d\'exclamation, aucun « … », aucune abréviation, aucun mot familier.',
  'Relu : chaque verbe s\'accorde avec son sujet; ça / sa, a / à, ce / se, son / sont vérifiés.'
];
function showResult(p){
  const r=$('#d-result'); r.hidden=false;
  r.innerHTML='<h4 style="margin-top:22px">Grille d\'autocorrection</h4><ul class="dcheck">'+CHECK.map((c,i)=>'<li><input type="checkbox" id="dc'+i+'"><label for="dc'+i+'">'+c+'</label></li>').join('')+'</ul>'+
    '<p class="stat-line" id="d-score"></p>'+
    '<div class="model"><span class="blabel">Plan modèle</span>'+p.html.replace(/<b class="t">[\s\S]*?<\/b>/,'')+'</div>'+
    '<div class="row" style="margin-top:14px"><button type="button" class="btn primary" id="d-next">Autre sujet</button><a class="btn ghost" href="#dth">Relire les thématiques</a></div>';
  const upd=()=>{ const n=$$('.dcheck input',r).filter(i=>i.checked).length; $('#d-score').textContent=n+' critère'+(n>1?'s':'')+' sur '+CHECK.length+(n>=9?' : prêt.':n>=7?' : solide, corrige les cases vides.':' : reprends les cases vides avant le prochain sujet.'); };
  $$('.dcheck input',r).forEach(i=>i.addEventListener('change',upd)); upd();
  if(st.done.indexOf(p.id)<0){ st.done.push(p.id); save(); hist(); }
  $('#d-next').addEventListener('click',()=>{ $('#d-work').hidden=true; $('#d-setup').hidden=false; sel.value=''; $('#d-setup').scrollIntoView({block:'start'}); });
  r.scrollIntoView({block:'start'});
}
})();
