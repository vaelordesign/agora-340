
// ------------------------------------------------------------------
// Moteur : fiches, quiz, examen blanc, cartes éclair. 100 % localStorage.
// ------------------------------------------------------------------
(function(){
const KEY='agora-340';
const $=(s,r)=> (r||document).querySelector(s);
const $$=(s,r)=> Array.prototype.slice.call((r||document).querySelectorAll(s));
const FICHES=$$('.fiche').map(f=>f.id);
const TITLE={}; $$('.fiche').forEach(f=>TITLE[f.id]=f.getAttribute('data-title'));
const MASTERABLE=FICHES.filter(id=>id!=='s0');

let state=load();
function load(){
  try{ const s=JSON.parse(localStorage.getItem(KEY)||'{}');
    return {mastered:s.mastered||{}, stats:s.stats||{}, cfg:s.cfg||null, exams:s.exams||[]}; }
  catch(e){ return {mastered:{},stats:{},cfg:null,exams:[]}; }
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){} }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function stat(id){ return state.stats[id]||{seen:0,ok:0,ko:0,last:null}; }
function record(id,score){ const st=stat(id); st.seen++; if(score>=1) st.ok++; else st.ko++; st.last=score; state.stats[id]=st; save(); updateBadge(); }
function groupOf(s){ return GROUPS.find(g=>g.s.indexOf(s)>=0)||{id:'g0',name:'Synthèse'}; }
function toReview(){ return BANK.filter(q=>{ const st=stat(q.id); return st.seen>0 && st.last<1; }); }
function updateBadge(){ const n=toReview().length; const b=$('#n-quiz'); b.textContent=n?n+' à revoir':''; b.style.display=n?'':'none'; }
function pct(a,b){ return b?Math.round(100*a/b):0; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtScore(x){ return (Math.round(x*10)/10).toString().replace('.',','); }

// ---------------- navigation
const VIEWS=['fiches','quiz','exam','cards'];
function showView(v){
  VIEWS.forEach(x=>$('#view-'+x).classList.toggle('on',x===v));
  $$('.tab').forEach(t=>t.setAttribute('aria-selected', t.getAttribute('data-view')===v ? 'true':'false'));
  if(v==='quiz' && !quiz) renderQuizSetup();
  if(v==='exam' && !exam) renderExamIntro();
  if(v==='cards' && !deck) renderCardsSetup();
}
$$('.tab').forEach(t=>t.addEventListener('click',()=>{ location.hash='#'+t.getAttribute('data-view'); }));
function route(){
  const h=(location.hash||'#fiches').slice(1);
  if(VIEWS.indexOf(h)>=0){ showView(h); if(h==='fiches') window.scrollTo(0,0); return; }
  if(/^s\d+$/.test(h) && $('#'+h)){ showView('fiches'); $('#toc').classList.remove('open'); setTimeout(()=>{ $('#'+h).scrollIntoView({block:'start'}); },0); return; }
  showView('fiches');
}
window.addEventListener('hashchange',route);
$$('.fiche').forEach(f=>f.style.scrollMarginTop='72px');

// ---------------- fiches : sommaire, maîtrise, actions
const tocLinks=$$('#toc a');
$('#toc-btn').addEventListener('click',()=>$('#toc').classList.toggle('open'));
tocLinks.forEach(a=>a.addEventListener('click',()=>$('#toc').classList.remove('open')));
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ tocLinks.forEach(a=>a.classList.toggle('cur', a.getAttribute('href')==='#'+en.target.id)); } });
  },{rootMargin:'-70px 0px -75% 0px',threshold:0});
  $$('.fiche').forEach(f=>io.observe(f));
}
function refreshMastery(){
  const done=MASTERABLE.filter(id=>state.mastered[id]).length;
  $('#toc-pct').textContent=done+(done>1?' fiches maîtrisées':' fiche maîtrisée')+' sur '+MASTERABLE.length;
  $('#toc-bar').style.width=pct(done,MASTERABLE.length)+'%';
  tocLinks.forEach(a=>a.classList.toggle('done', !!state.mastered[a.getAttribute('href').slice(1)]));
  $$('#guide-list a').forEach(a=>a.classList.toggle('done', !!state.mastered[a.getAttribute('data-s')]));
  $$('.fiche').forEach(f=>{ const b=$('.btn-master',f); if(b){ const on=!!state.mastered[f.id]; b.textContent=on?'Fiche maîtrisée ✓':'Je maîtrise cette fiche'; b.classList.toggle('done',on); } });
}
$$('.fiche').forEach(f=>{
  const act=$('.sec-actions',f); if(!act) return;
  const id=f.id;
  const b1=document.createElement('button'); b1.type='button'; b1.className='btn btn-master';
  b1.addEventListener('click',()=>{ state.mastered[id]=!state.mastered[id]; save(); refreshMastery(); });
  act.appendChild(b1);
  const n=BANK.filter(q=>q.s===id && q.t!=='dev').length;
  if(n){ const b2=document.createElement('button'); b2.type='button'; b2.className='btn primary'; b2.textContent='Quiz sur cette fiche ('+n+')';
    b2.addEventListener('click',()=>{ startQuiz({sections:[id],types:['qcm','vf','courte'],n:0,prio:false,label:'Fiche '+id.slice(1)+' · '+TITLE[id]}); location.hash='#quiz'; });
    act.appendChild(b2); }
  const nd=BANK.filter(q=>q.s===id && q.t==='dev').length;
  if(nd){ const b3=document.createElement('button'); b3.type='button'; b3.className='btn ghost'; b3.textContent=nd>1?'Questions à développement ('+nd+')':'Question à développement';
    b3.addEventListener('click',()=>{ startQuiz({sections:[id],types:['dev'],n:0,prio:false,label:'Développement · '+TITLE[id]}); location.hash='#quiz'; });
    act.appendChild(b3); }
});
(function(){ const p=$('#s0 .piege'); if(p){ const d=document.createElement('div'); d.className='sec-actions'; d.innerHTML='<button type="button" class="btn" id="btn-print">Imprimer les fiches</button><button type="button" class="btn ghost" id="btn-reset">Effacer ma progression</button>'; p.insertAdjacentElement('afterend',d);
  $('#btn-print').addEventListener('click',()=>window.print());
  $('#btn-reset').addEventListener('click',()=>{ if(confirm('Effacer les fiches cochées, les résultats de quiz et les examens blancs sur cet appareil ?')){ state={mastered:{},stats:{},cfg:null,exams:[]}; save(); refreshMastery(); updateBadge(); } });
}})();

// ---------------- quiz
let quiz=null;
const qroot=$('#quiz-root');
function typeLabel(t){ return TYPES[t]||t; }
function renderQuizSetup(){
  quiz=null;
  const cfg=state.cfg||{groups:GROUPS.map(g=>g.id),types:['qcm','vf','courte'],n:20,prio:false};
  const rev=toReview();
  const seen=Object.keys(state.stats).length;
  const oks=Object.keys(state.stats).reduce((a,k)=>a+state.stats[k].ok,0);
  const tot=Object.keys(state.stats).reduce((a,k)=>a+state.stats[k].seen,0);
  qroot.innerHTML=
   '<div class="card"><div class="eyebrow">Quiz</div><h2>Compose ton quiz</h2>'+
   '<p class="lead">Choisis les fiches, les types de questions et le nombre. Les réponses sont corrigées une par une, avec l\'explication.</p>'+
   '<div class="field"><label>Fiches</label><div class="chips" id="q-groups">'+GROUPS.map(g=>'<button type="button" class="chip" data-g="'+g.id+'" aria-pressed="'+(cfg.groups.indexOf(g.id)>=0)+'">'+g.name+'<span class="cnt">'+BANK.filter(q=>g.s.indexOf(q.s)>=0).length+'</span></button>').join('')+'</div></div>'+
   '<div class="field"><label>Types de questions</label><div class="chips" id="q-types">'+Object.keys(TYPES).map(t=>'<button type="button" class="chip" data-t="'+t+'" aria-pressed="'+(cfg.types.indexOf(t)>=0)+'">'+TYPES[t]+'<span class="cnt">'+BANK.filter(q=>q.t===t).length+'</span></button>').join('')+'</div></div>'+
   '<div class="row"><div class="field"><label>Nombre de questions</label><select id="q-n"><option value="10">10</option><option value="20">20</option><option value="40">40</option><option value="0">Toutes</option></select></div>'+
   '<div class="field"><label>Priorité</label><button type="button" class="chip" id="q-prio" aria-pressed="'+!!cfg.prio+'">Prioriser mes erreurs</button></div></div>'+
   '<div class="row"><button type="button" class="btn primary" id="q-start">Commencer</button><span class="stat-line" id="q-avail"></span></div></div>'+
   '<div class="card"><div class="eyebrow">Ma progression</div>'+
   (seen?'<div class="score"><div><small>Questions vues</small><b>'+seen+'<span style="font-size:16px;color:var(--muted)"> / '+BANK.length+'</span></b></div><div><small>Taux de réussite</small><b>'+pct(oks,tot)+' %</b></div><div><small>À revoir</small><b>'+rev.length+'</b></div></div>'+
     '<div class="row">'+(rev.length?'<button type="button" class="btn primary" id="q-review">Refaire mes '+rev.length+' question'+(rev.length>1?'s':'')+' ratée'+(rev.length>1?'s':'')+'</button>':'')+'</div>'
    :'<p class="empty">Aucune question faite pour l\'instant. Les résultats resteront sur cet appareil.</p>')+
   '</div>';
  $('#q-n').value=String(cfg.n);
  function readCfg(){ return {groups:$$('#q-groups .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-g')), types:$$('#q-types .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-t')), n:parseInt($('#q-n').value,10), prio:$('#q-prio').getAttribute('aria-pressed')==='true'}; }
  function avail(){ const c=readCfg(); const secs=GROUPS.filter(g=>c.groups.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); const n=BANK.filter(q=>secs.indexOf(q.s)>=0 && c.types.indexOf(q.t)>=0).length; $('#q-avail').textContent=n+' question'+(n>1?'s':'')+' disponible'+(n>1?'s':'')+' avec ces choix'; $('#q-start').disabled=!n; return c; }
  $$('#q-groups .chip, #q-types .chip, #q-prio').forEach(c=>c.addEventListener('click',()=>{ c.setAttribute('aria-pressed', c.getAttribute('aria-pressed')==='true'?'false':'true'); avail(); }));
  $('#q-n').addEventListener('change',avail);
  avail();
  $('#q-start').addEventListener('click',()=>{ const c=avail(); state.cfg=c; save(); const secs=GROUPS.filter(g=>c.groups.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); startQuiz({sections:secs,types:c.types,n:c.n,prio:c.prio,label:'Quiz'}); });
  const rb=$('#q-review'); if(rb) rb.addEventListener('click',()=>startQuiz({ids:rev.map(q=>q.id),n:0,label:'Mes erreurs'}));
}
function startQuiz(o){
  let list;
  if(o.ids){ list=BANK.filter(q=>o.ids.indexOf(q.id)>=0); }
  else { list=BANK.filter(q=>o.sections.indexOf(q.s)>=0 && o.types.indexOf(q.t)>=0); }
  shuffle(list);
  if(o.prio){ list.sort((a,b)=>{ const sa=stat(a.id), sb=stat(b.id); const ka=(sa.seen&&sa.last<1)?0:(sa.seen?2:1); const kb=(sb.seen&&sb.last<1)?0:(sb.seen?2:1); return ka-kb; }); }
  if(o.n) list=list.slice(0,o.n);
  // ordre : les développements à la fin, comme dans un vrai examen
  list.sort((a,b)=>(a.t==='dev')-(b.t==='dev'));
  quiz={list:list.map(q=>({q:q, order:q.t==='qcm'?shuffle(q.o.map((_,i)=>i)):null, score:null})), i:0, label:o.label||'Quiz'};
  renderQuestion();
  window.scrollTo(0,0);
}
function renderQuestion(){
  const it=quiz.list[quiz.i], q=it.q, n=quiz.list.length;
  const g=groupOf(q.s);
  let body='';
  if(q.t==='qcm'){ body='<div class="opts" id="opts">'+it.order.map((oi,k)=>'<button type="button" class="opt" data-i="'+oi+'"><span class="k">'+(k+1)+'</span>'+esc(q.o[oi])+'</button>').join('')+'</div>'; }
  else if(q.t==='vf'){ body='<div class="opts" id="opts"><button type="button" class="opt" data-i="1"><span class="k">1</span>Vrai</button><button type="button" class="opt" data-i="0"><span class="k">2</span>Faux</button></div>'; }
  else { body='<textarea id="q-text" placeholder="Écris ta réponse ici, ou réponds dans ta tête, puis compare avec le modèle."></textarea><div class="row" style="margin-top:10px"><button type="button" class="btn primary" id="q-reveal">'+(q.t==='dev'?'Voir le plan modèle':'Voir la réponse modèle')+'</button></div>'; }
  qroot.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">'+esc(quiz.label)+' · question '+(quiz.i+1)+' sur '+n+'</span><span class="qtype">'+typeLabel(q.t)+' · '+esc(g.name)+'</span></div>'+
    '<div class="progress"><i style="width:'+pct(quiz.i,n)+'%"></i></div>'+
    '<div class="qtext">'+esc(q.q)+'</div>'+body+'<div id="q-fb"></div>'+
    '<div class="qnav"><button type="button" class="btn ghost" id="q-quit">Arrêter le quiz</button><span></span></div></div>';
  $('#q-quit').addEventListener('click',()=>{ if(quiz.i===0||confirm('Arrêter ce quiz ? Les réponses déjà données sont retenues.')){ quiz=null; renderQuizSetup(); } });
  if(q.t==='qcm'||q.t==='vf'){ $$('#opts .opt').forEach(b=>b.addEventListener('click',()=>answerChoice(parseInt(b.getAttribute('data-i'),10)))); }
  else { $('#q-reveal').addEventListener('click',revealModel); }
}
function answerChoice(i){
  const it=quiz.list[quiz.i], q=it.q;
  const correct = q.t==='qcm' ? q.a : (q.a?1:0);
  const ok = i===correct;
  $$('#opts .opt').forEach(b=>{ b.disabled=true; const bi=parseInt(b.getAttribute('data-i'),10); if(bi===correct) b.classList.add('ok'); else if(bi===i) b.classList.add('ko'); });
  it.score=ok?1:0; record(q.id,it.score);
  $('#q-fb').innerHTML='<div class="fb '+(ok?'ok':'ko')+'"><span class="blabel">'+(ok?'Bonne réponse':'Mauvaise réponse')+'</span><p>'+esc(q.w)+'</p><p style="margin-top:6px"><a href="#'+q.s+'" class="ui" style="font-size:13px">Relire la fiche : '+esc(TITLE[q.s])+'</a></p></div>';
  nextButton();
}
function revealModel(){
  const it=quiz.list[quiz.i], q=it.q;
  $('#q-reveal').disabled=true;
  $('#q-fb').innerHTML='<div class="model"><span class="blabel">'+(q.t==='dev'?'Plan modèle':'Réponse modèle')+'</span>'+q.m+(q.k?'<div class="kw">'+q.k.map(k=>'<span>'+esc(k)+'</span>').join('')+'</div>':'')+'</div>'+
    '<div class="grade"><span class="eyebrow" style="align-self:center">Auto-évaluation :</span><button type="button" class="btn" data-g="1">Je l\'avais</button><button type="button" class="btn" data-g="0.5">À moitié</button><button type="button" class="btn" data-g="0">Raté</button></div>';
  $$('#q-fb .grade .btn').forEach(b=>b.addEventListener('click',()=>{ const s=parseFloat(b.getAttribute('data-g')); it.score=s; record(q.id,s); $$('#q-fb .grade .btn').forEach(x=>{ x.disabled=true; x.classList.toggle('done',x===b); }); nextButton(); }));
}
function nextButton(){
  const last=quiz.i===quiz.list.length-1;
  const nav=$('.qnav'); const b=document.createElement('button'); b.type='button'; b.className='btn primary'; b.textContent=last?'Voir mes résultats':'Question suivante';
  b.addEventListener('click',()=>{ if(last) renderResults(); else { quiz.i++; renderQuestion(); window.scrollTo(0,0); } });
  nav.lastElementChild.replaceWith(b); b.focus();
}
document.addEventListener('keydown',e=>{
  if(!quiz || !$('#view-quiz').classList.contains('on')) return;
  if(e.target && (e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT'||e.target.tagName==='SELECT')) return;
  const opts=$$('#opts .opt:not(:disabled)');
  if(opts.length && /^[1-4]$/.test(e.key)){ const b=opts[parseInt(e.key,10)-1]; if(b) b.click(); }
  else if(e.key==='Enter'){ const nb=$('.qnav .btn.primary'); if(nb) nb.click(); }
});
function renderResults(){
  const L=quiz.list, n=L.length;
  const total=L.reduce((a,it)=>a+(it.score||0),0);
  const byG={}; L.forEach(it=>{ const g=groupOf(it.q.s); byG[g.id]=byG[g.id]||{name:g.name,n:0,s:0}; byG[g.id].n++; byG[g.id].s+=it.score||0; });
  const missed=L.filter(it=>(it.score||0)<1);
  const p=pct(total,n);
  const msg = p>=90?'Excellent. Tu es prêt pour cette partie.': p>=75?'Solide. Relis les fiches des questions ratées et refais-les.': p>=50?'Ça avance. Concentre-toi sur les fiches ci-dessous avant de continuer.':'Relis les fiches concernées avant de refaire un quiz : ça vaut mieux que de deviner.';
  qroot.innerHTML='<div class="card"><div class="eyebrow">'+esc(quiz.label)+' · résultats</div><h2>'+fmtScore(total)+' sur '+n+'</h2><p class="lead">'+msg+'</p>'+
    '<div class="score"><div><small>Note</small><b>'+p+' %</b></div><div><small>Réussies</small><b>'+L.filter(it=>it.score>=1).length+'</b></div><div><small>À revoir</small><b>'+missed.length+'</b></div></div>'+
    '<ul class="bygroup">'+Object.keys(byG).map(k=>'<li><span>'+esc(byG[k].name)+'</span><span class="tnum">'+fmtScore(byG[k].s)+' / '+byG[k].n+'</span><span class="bar"><i style="width:'+pct(byG[k].s,byG[k].n)+'%"></i></span></li>').join('')+'</ul>'+
    '<div class="row">'+(missed.length?'<button type="button" class="btn primary" id="r-redo">Refaire les '+missed.length+' ratée'+(missed.length>1?'s':'')+'</button>':'')+'<button type="button" class="btn" id="r-new">Nouveau quiz</button><a class="btn ghost" href="#fiches">Retour aux fiches</a></div></div>'+
    (missed.length?'<div class="card"><div class="eyebrow">À revoir</div><ul class="missed">'+missed.map(it=>'<li>'+esc(it.q.q)+' <a href="#'+it.q.s+'">Fiche '+it.q.s.slice(1)+' : '+esc(TITLE[it.q.s])+'</a></li>').join('')+'</ul></div>':'');
  const rd=$('#r-redo'); if(rd) rd.addEventListener('click',()=>startQuiz({ids:missed.map(it=>it.q.id),n:0,label:'Reprise'}));
  $('#r-new').addEventListener('click',()=>{ quiz=null; renderQuizSetup(); });
  quiz={done:true,list:L,label:quiz.label};
  window.scrollTo(0,0);
}

// ---------------- examen blanc
let exam=null;
const eroot=$('#exam-root');
const EXAM_MIX={qcm:18,vf:6,courte:6,dev:2};
function renderExamIntro(){
  exam=null;
  const last=state.exams.length?state.exams[state.exams.length-1]:null;
  const total=Object.keys(EXAM_MIX).reduce((a,k)=>a+EXAM_MIX[k],0);
  eroot.innerHTML='<div class="card"><div class="eyebrow">Examen blanc</div><h2>Comme le vrai, ou presque</h2>'+
    '<p class="lead">'+total+' questions tirées au hasard dans toute la matière : '+EXAM_MIX.qcm+' choix multiples, '+EXAM_MIX.vf+' vrai ou faux, '+EXAM_MIX.courte+' réponses courtes et '+EXAM_MIX.dev+' développements. Aucune correction avant la remise. Tu peux revenir sur tes réponses.</p>'+
    '<div class="field"><label>Durée</label><select id="e-dur"><option value="120">2 heures (comme l\'examen)</option><option value="60">1 heure</option><option value="0">Sans limite</option></select></div>'+
    '<div class="row"><button type="button" class="btn primary" id="e-start">Commencer l\'examen</button></div></div>'+
    '<div class="card"><div class="eyebrow">Mes examens blancs</div>'+(state.exams.length?'<ul class="bygroup">'+state.exams.slice().reverse().map(x=>'<li><span>'+esc(x.date)+'</span><span class="tnum">'+fmtScore(x.score)+' / '+x.total+'</span><span class="bar"><i style="width:'+pct(x.score,x.total)+'%"></i></span></li>').join('')+'</ul>':'<p class="empty">Aucun examen blanc fait pour l\'instant.</p>')+'</div>';
  $('#e-start').addEventListener('click',()=>startExam(parseInt($('#e-dur').value,10)));
}
function pickSpread(type,count){
  // répartit les questions entre les groupes, à tour de rôle
  const buckets=GROUPS.map(g=>shuffle(BANK.filter(q=>q.t===type && g.s.indexOf(q.s)>=0)));
  const out=[]; let guard=0;
  while(out.length<count && guard<1000){ guard++; let any=false; for(const b of shuffle(buckets.slice())){ if(out.length>=count) break; if(b.length){ out.push(b.pop()); any=true; } } if(!any) break; }
  return out;
}
function startExam(mins){
  let list=[];
  Object.keys(EXAM_MIX).forEach(t=>{ list=list.concat(pickSpread(t,EXAM_MIX[t])); });
  const rank={qcm:0,vf:1,courte:2,dev:3}; list.sort((a,b)=>rank[a.t]-rank[b.t]);
  exam={list:list.map(q=>({q:q,order:q.t==='qcm'?shuffle(q.o.map((_,i)=>i)):null,sel:null,text:'',score:null})),i:0,mins:mins,end:mins?Date.now()+mins*60000:0,timer:null,submitted:false};
  if(mins){ exam.timer=setInterval(tickExam,1000); }
  renderExamQ(); window.scrollTo(0,0);
}
function tickExam(){
  if(!exam||exam.submitted){ return; }
  const left=exam.end-Date.now(); const el=$('#e-timer'); if(!el) return;
  if(left<=0){ clearInterval(exam.timer); submitExam(true); return; }
  const m=Math.floor(left/60000), s=Math.floor((left%60000)/1000);
  el.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s; el.classList.toggle('low',left<10*60000);
}
function examMap(){ return '<div class="exam-map">'+exam.list.map((it,k)=>'<button type="button" data-k="'+k+'" class="'+(k===exam.i?'cur ':'')+((it.sel!==null||it.text.trim())?'ans':'')+'" title="'+esc(TYPES[it.q.t])+'">'+(k+1)+'</button>').join('')+'</div>'; }
function renderExamQ(){
  const it=exam.list[exam.i], q=it.q, n=exam.list.length;
  let body='';
  if(q.t==='qcm'){ body='<div class="opts" id="e-opts">'+it.order.map((oi,k)=>'<button type="button" class="opt'+(it.sel===oi?' sel':'')+'" data-i="'+oi+'"><span class="k">'+(k+1)+'</span>'+esc(q.o[oi])+'</button>').join('')+'</div>'; }
  else if(q.t==='vf'){ body='<div class="opts" id="e-opts"><button type="button" class="opt'+(it.sel===1?' sel':'')+'" data-i="1"><span class="k">1</span>Vrai</button><button type="button" class="opt'+(it.sel===0?' sel':'')+'" data-i="0"><span class="k">2</span>Faux</button></div>'; }
  else { body='<textarea id="e-text" placeholder="'+(q.t==='dev'?'Rédige ton plan ou ton développement.':'Rédige ta réponse.')+'">'+esc(it.text)+'</textarea>'; }
  const answered=exam.list.filter(x=>x.sel!==null||x.text.trim()).length;
  eroot.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">Examen blanc · question '+(exam.i+1)+' sur '+n+'</span><span class="row"><span class="qtype">'+TYPES[q.t]+'</span>'+(exam.mins?'<span class="timer" id="e-timer">--:--</span>':'')+'</span></div>'+
    examMap()+'<div class="qtext">'+esc(q.q)+'</div>'+body+
    '<div class="qnav"><span class="row"><button type="button" class="btn" id="e-prev" '+(exam.i===0?'disabled':'')+'>Précédente</button><button type="button" class="btn" id="e-next" '+(exam.i===n-1?'disabled':'')+'>Suivante</button></span>'+
    '<button type="button" class="btn primary" id="e-submit">Remettre l\'examen ('+answered+' / '+n+')</button></div>'+
    '<p class="stat-line" style="margin-top:12px"><button type="button" class="btn ghost sm" id="e-quit">Abandonner</button></p></div>';
  if(exam.mins) tickExam();
  $$('#e-opts .opt').forEach(b=>b.addEventListener('click',()=>{ it.sel=parseInt(b.getAttribute('data-i'),10); renderExamQ(); }));
  const ta=$('#e-text'); if(ta){ ta.addEventListener('input',()=>{ it.text=ta.value; }); }
  $('#e-prev').addEventListener('click',()=>{ exam.i--; renderExamQ(); });
  $('#e-next').addEventListener('click',()=>{ exam.i++; renderExamQ(); });
  $$('.exam-map button').forEach(b=>b.addEventListener('click',()=>{ exam.i=parseInt(b.getAttribute('data-k'),10); renderExamQ(); }));
  $('#e-submit').addEventListener('click',()=>{ const un=n-exam.list.filter(x=>x.sel!==null||x.text.trim()).length; if(!un||confirm(un+' question'+(un>1?'s':'')+' sans réponse. Remettre quand même ?')) submitExam(false); });
  $('#e-quit').addEventListener('click',()=>{ if(confirm('Abandonner cet examen blanc ? Rien ne sera enregistré.')){ if(exam.timer) clearInterval(exam.timer); exam=null; renderExamIntro(); } });
}
function submitExam(timeout){
  if(exam.timer) clearInterval(exam.timer);
  exam.submitted=true;
  exam.list.forEach(it=>{ const q=it.q; if(q.t==='qcm'){ it.score=it.sel===q.a?1:0; record(q.id,it.score); } else if(q.t==='vf'){ it.score=it.sel===null?0:((it.sel===1)===q.a?1:0); record(q.id,it.score); } });
  renderCorrection(timeout);
  window.scrollTo(0,0);
}
function renderCorrection(timeout){
  const L=exam.list, n=L.length;
  const auto=L.filter(it=>it.q.t==='qcm'||it.q.t==='vf');
  const manual=L.filter(it=>it.q.t==='courte'||it.q.t==='dev');
  function totals(){ const graded=manual.every(it=>it.score!==null); const s=L.reduce((a,it)=>a+(it.score||0),0); return {graded:graded,s:s}; }
  function head(){ const t=totals(); return '<div class="card" id="e-head"><div class="eyebrow">Examen blanc · correction</div><h2>'+(t.graded?fmtScore(t.s)+' sur '+n:'Corrige tes réponses écrites')+'</h2>'+
    (timeout?'<p class="lead">Le temps est écoulé, l\'examen a été remis automatiquement.</p>':'')+
    '<div class="score"><div><small>Choix multiples et vrai ou faux</small><b>'+fmtScore(auto.reduce((a,it)=>a+it.score,0))+' / '+auto.length+'</b></div><div><small>Réponses écrites</small><b>'+(t.graded?fmtScore(manual.reduce((a,it)=>a+it.score,0)):'…')+' / '+manual.length+'</b></div><div><small>Note</small><b>'+(t.graded?pct(t.s,n)+' %':'…')+'</b></div></div>'+
    (t.graded?'<div class="row"><button type="button" class="btn primary" id="e-again">Nouvel examen blanc</button><a class="btn ghost" href="#fiches">Retour aux fiches</a></div>':'<p class="stat-line">Note les '+manual.length+' réponses écrites ci-dessous pour obtenir la note finale.</p>')+'</div>'; }
  eroot.innerHTML=head()+'<div class="card">'+L.map((it,k)=>{ const q=it.q; let you='';
    if(q.t==='qcm'){ const ok=it.score===1; you='<p class="you '+(ok?'ok':'ko')+'">Ta réponse : <b>'+(it.sel===null?'aucune':esc(q.o[it.sel]))+'</b>'+(ok?' ✓':'')+'</p>'+(ok?'':'<p class="you">Bonne réponse : <b>'+esc(q.o[q.a])+'</b></p>')+'<p style="font-size:15px;color:var(--ink-2)">'+esc(q.w)+'</p>'; }
    else if(q.t==='vf'){ const ok=it.score===1; you='<p class="you '+(ok?'ok':'ko')+'">Ta réponse : <b>'+(it.sel===null?'aucune':(it.sel===1?'Vrai':'Faux'))+'</b>'+(ok?' ✓':'')+'</p>'+(ok?'':'<p class="you">Bonne réponse : <b>'+(q.a?'Vrai':'Faux')+'</b></p>')+'<p style="font-size:15px;color:var(--ink-2)">'+esc(q.w)+'</p>'; }
    else { you='<p class="you">Ta réponse :</p><div class="fb" style="white-space:pre-wrap;margin-top:4px">'+(it.text.trim()?esc(it.text):'<span class="empty">aucune réponse</span>')+'</div><div class="model"><span class="blabel">'+(q.t==='dev'?'Plan modèle':'Réponse modèle')+'</span>'+q.m+(q.k?'<div class="kw">'+q.k.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>':'')+'</div>'+
      '<div class="grade" data-k="'+k+'"><span class="eyebrow" style="align-self:center">Ma note :</span><button type="button" class="btn'+(it.score===1?' done':'')+'" data-g="1">Juste</button><button type="button" class="btn'+(it.score===0.5?' done':'')+'" data-g="0.5">À moitié</button><button type="button" class="btn'+(it.score===0?' done':'')+'" data-g="0">Raté</button></div>'; }
    return '<div class="corr"><span class="eyebrow">Question '+(k+1)+' · '+TYPES[q.t]+' · <a href="#'+q.s+'">fiche '+q.s.slice(1)+'</a></span><div class="qtext">'+esc(q.q)+'</div>'+you+'</div>'; }).join('')+'</div>';
  function bind(){
    $$('.grade[data-k] .btn').forEach(b=>b.addEventListener('click',()=>{ const k=parseInt(b.parentNode.getAttribute('data-k'),10); const it=L[k]; const first=it.score===null; it.score=parseFloat(b.getAttribute('data-g')); if(first) record(it.q.id,it.score); else { state.stats[it.q.id].last=it.score; save(); }
      $$('.btn',b.parentNode).forEach(x=>x.classList.toggle('done',x===b));
      const t=totals(); $('#e-head').outerHTML=head(); if(t.graded && !exam.saved){ exam.saved=true; state.exams.push({date:new Date().toLocaleDateString('fr-CA',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}),score:t.s,total:n}); if(state.exams.length>20) state.exams.shift(); save(); }
      const ag=$('#e-again'); if(ag) ag.addEventListener('click',()=>{ exam=null; renderExamIntro(); window.scrollTo(0,0); }); }));
  }
  bind();
  if(!manual.length){ const t=totals(); state.exams.push({date:new Date().toLocaleDateString('fr-CA',{day:'numeric',month:'long'}),score:t.s,total:n}); save(); }
}

// ---------------- cartes éclair
let deck=null;
const croot=$('#cards-root');
function renderCardsSetup(){
  deck=null;
  const cards=BANK.filter(q=>q.t==='courte');
  croot.innerHTML='<div class="card"><div class="eyebrow">Cartes éclair</div><h2>Une question, une réponse</h2><p class="lead">Chaque carte pose une question de réponse courte. Réfléchis, retourne la carte, puis dis honnêtement si tu l\'avais. Les cartes « à revoir » reviennent en fin de paquet.</p>'+
    '<div class="field"><label>Fiches</label><div class="chips" id="c-groups">'+GROUPS.map(g=>'<button type="button" class="chip" data-g="'+g.id+'" aria-pressed="true">'+g.name+'<span class="cnt">'+cards.filter(q=>g.s.indexOf(q.s)>=0).length+'</span></button>').join('')+'</div></div>'+
    '<div class="row"><button type="button" class="btn primary" id="c-start">Commencer</button><span class="stat-line" id="c-avail"></span></div></div>';
  function sel(){ const gs=$$('#c-groups .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-g')); const secs=GROUPS.filter(g=>gs.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); const l=cards.filter(q=>secs.indexOf(q.s)>=0); $('#c-avail').textContent=l.length+' carte'+(l.length>1?'s':''); $('#c-start').disabled=!l.length; return l; }
  $$('#c-groups .chip').forEach(c=>c.addEventListener('click',()=>{ c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true'); sel(); }));
  sel();
  $('#c-start').addEventListener('click',()=>{ deck={queue:shuffle(sel().slice()),flipped:false,ok:0,again:0,total:0}; deck.total=deck.queue.length; renderCard(); });
}
function renderCard(){
  if(!deck.queue.length){ croot.innerHTML='<div class="card"><div class="eyebrow">Cartes éclair · terminé</div><h2>Paquet terminé</h2><div class="score"><div><small>Sues du premier coup</small><b>'+deck.ok+'</b></div><div><small>Revues</small><b>'+deck.again+'</b></div></div><div class="row"><button type="button" class="btn primary" id="c-new">Nouveau paquet</button><a class="btn ghost" href="#fiches">Retour aux fiches</a></div></div>'; $('#c-new').addEventListener('click',renderCardsSetup); return; }
  const q=deck.queue[0];
  croot.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">Cartes éclair · '+(deck.total-deck.queue.length+1)+' sur '+deck.total+(deck.queue.length>deck.total?'':'')+'</span><span class="qtype">'+esc(TITLE[q.s])+'</span></div>'+
    '<div class="progress"><i style="width:'+pct(deck.total-deck.queue.length,deck.total)+'%"></i></div>'+
    '<div class="flash" id="c-card" role="button" tabindex="0"><div class="side" id="c-front">'+esc(q.q)+'</div><div class="side back" id="c-back" hidden>'+q.m+'</div><div class="hint" id="c-hint">Clique ou appuie sur Espace pour retourner</div></div>'+
    '<div class="grade" id="c-grade" hidden><button type="button" class="btn" data-r="ok">Je l\'avais</button><button type="button" class="btn" data-r="again">À revoir</button><a href="#'+q.s+'" class="btn ghost">Relire la fiche</a></div>'+
    '<div class="qnav"><button type="button" class="btn ghost" id="c-quit">Arrêter</button></div></div>';
  const flip=()=>{ if(deck.flipped) return; deck.flipped=true; $('#c-front').hidden=true; $('#c-back').hidden=false; $('#c-hint').hidden=true; $('#c-grade').hidden=false; };
  $('#c-card').addEventListener('click',flip);
  $('#c-card').addEventListener('keydown',e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); flip(); } });
  $$('#c-grade .btn[data-r]').forEach(b=>b.addEventListener('click',()=>{ const r=b.getAttribute('data-r'); deck.queue.shift(); deck.flipped=false; if(r==='ok'){ deck.ok++; record(q.id,1); } else { deck.again++; record(q.id,0); deck.queue.push(q); } renderCard(); }));
  $('#c-quit').addEventListener('click',()=>{ deck=null; renderCardsSetup(); });
  $('#c-card').focus({preventScroll:true});
}

// ---------------- démarrage
refreshMastery(); updateBadge();
route();
})();
