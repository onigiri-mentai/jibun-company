'use strict';
const $ = id => document.getElementById(id);
const STORAGE = 'jibun-company-v1';
const difficulties = {easy:{name:'かんたん',exp:300,icon:'☀'},normal:{name:'ふつう',exp:500,icon:'✦'},hard:{name:'がんばる',exp:800,icon:'⚡'}};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function localDate(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
const day = () => localDate();
function addDays(date,days) { const copy=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12);copy.setDate(copy.getDate()+days);return copy; }
function parseDate(value) { if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d,12);return localDate(date)===value?date:null; }
function quickDeadline(option,now=new Date()) { if(option==='today')return localDate(now);if(option==='tomorrow')return localDate(addDays(now,1));if(option==='week')return localDate(addDays(now,(7-now.getDay())%7));return null; }
function deadlineInfo(value,now=new Date()) { const date=parseDate(value);if(!date)return null;const today=localDate(now),tomorrow=quickDeadline('tomorrow',now),label=value===today?'今日まで':value===tomorrow?'明日まで':`${date.getMonth()+1}/${date.getDate()}まで`;return {label:value<today?`${date.getMonth()+1}/${date.getDate()} 締切済み`:label,near:value<=tomorrow,overdue:value<today}; }
const initial = () => ({exp:0,day:day(),today:0,sales:0,companyName:'株式会社じぶん',established:false,sound:false,tasks:[{id:'first1',name:'洗濯する',difficulty:'easy'},{id:'first2',name:'メールを返す',difficulty:'normal'},{id:'first3',name:'歯磨きする',difficulty:'easy'}]});
let state;
try { state=JSON.parse(localStorage.getItem(STORAGE)); } catch {}
if(!state||!Number.isFinite(state.exp)||state.exp<0||!Array.isArray(state.tasks))state=initial();
// Existing companies keep their tasks, EXP, and default name without repeating setup.
if(typeof state.companyName!=='string'||!state.companyName.trim())state.companyName='株式会社じぶん';
if(typeof state.established!=='boolean')state.established=true;
state.tasks=state.tasks.filter(t=>t&&typeof t.name==='string').map(t=>({...t,difficulty:difficulties[t.difficulty]?t.difficulty:'normal',deadline:parseDate(t.deadline)?t.deadline:null}));
let busy=false,sound=state.sound===true,deadlineChoice=null,companyMode='rename';
function daily(){if(state.day!==day()){state.day=day();state.today=0;state.sales=0;}}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{}}
function growth(exp){let level=1,cost=1000,remaining=exp;while(remaining>=cost){remaining-=cost;level++;cost=level*1000;}return{level,cost,remaining};}
function render(visualExp=state.exp){
 daily();const g=growth(visualExp);
 $('company-name').textContent=state.companyName;$('office-company').textContent=state.companyName+' 本社';
 $('level').textContent=g.level;$('exp').textContent=g.remaining.toLocaleString();$('goal').textContent=g.cost.toLocaleString();$('progress').style.width=g.remaining/g.cost*100+'%';$('percent').textContent=Math.floor(g.remaining/g.cost*100)+'%';
 $('today').textContent=state.today;$('sales').textContent=state.sales.toLocaleString();$('count').textContent=state.tasks.length;
 $('office').className='office '+(g.level>=3?'lv3':g.level===2?'lv2':'');$('unlock').textContent=g.level===1?'🌿 観葉植物をお迎え':g.level===2?'💻 PCと棚を導入':'✦ 会社がもっと成長';$('office-note').textContent=g.level===1?'小さな一歩から、大きな会社へ。':g.level===2?'緑のあるオフィス。いい感じ。':'社長、会社らしくなってきました。';
 $('tasks').replaceChildren();
 for(const task of state.tasks){
  const d=difficulties[task.difficulty],due=deadlineInfo(task.deadline),button=document.createElement('button');button.className='task'+(due?.near?' deadline-near':'');
  button.setAttribute('aria-label',task.name+'を案件完遂する。'+(due?due.label+'。':'')+'報酬'+d.exp+' EXP');
  const circle=document.createElement('span');circle.className='check';circle.textContent='✓';
  const details=document.createElement('span');details.className='task-details';const name=document.createElement('span');name.className='task-name';name.textContent=task.name;
  const meta=document.createElement('span');meta.className='task-meta';const badge=document.createElement('span');badge.className='task-difficulty';badge.textContent=d.icon+' '+d.name;meta.append(badge);
  if(due){const deadline=document.createElement('span');deadline.className='task-deadline'+(due.overdue?' overdue':'');deadline.textContent=due.label;meta.append(deadline);}
  details.append(name,meta);const reward=document.createElement('span');reward.className='task-exp';reward.textContent='+'+d.exp;const small=document.createElement('small');small.textContent='COMPANY EXP';reward.append(small);
  button.append(circle,details,reward);button.onclick=()=>complete(task.id);$('tasks').append(button);
 }
 if(!state.tasks.length){const e=document.createElement('div');e.className='empty';e.textContent='全案件、完遂。社長、おつかれさまでした。\n営業部は次の受注をお待ちしています。';$('tasks').append(e);}
 save();
}
// A tiny in-house orchestra: all sounds are synthesized, with no audio downloads.
let audio,master;const sounding=new Set();
function ensureAudio(){if(!sound)return;try{if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.32;const limiter=audio.createDynamicsCompressor();limiter.threshold.value=-14;limiter.ratio.value=8;master.connect(limiter);limiter.connect(audio.destination);}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function note(freq,offset=0,duration=.12,type='triangle',volume=.14,group){if(!sound||!audio)return;try{const osc=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+offset;osc.type=type;osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(master);sounding.add(osc);group?.add(osc);osc.onended=()=>{sounding.delete(osc);group?.delete(osc);osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.02);}catch{}}
function thump(group,offset=0){if(!sound||!audio)return;try{const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime+offset;osc.frequency.setValueAtTime(155,now);osc.frequency.exponentialRampToValueAtTime(42,now+.18);gain.gain.setValueAtTime(.45,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.24);osc.connect(gain);gain.connect(master);sounding.add(osc);group?.add(osc);osc.onended=()=>{sounding.delete(osc);group?.delete(osc);osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+.25);}catch{}}
function stopSounds(group=sounding){for(const node of [...group]){try{node.stop();}catch{}}group.clear();}
function entranceSound(kind,anticipation,group){if(kind==='complete'){note(740,0,.075,'triangle',.18,group);note(988,.04,.075,'triangle',.14,group);return;}const span=Math.max(.12,anticipation/1000-.32);[392,494,587].forEach((f,i)=>note(f,i*span/2,.10,'triangle',.15,group));}
function resultSound(kind,group){
 thump(group,kind==='complete'?.30:0);
 if(kind==='level'){
  // Brass-like chords, a rising call, then a deliberately oversized closing chord.
  [262,330,392].forEach(f=>note(f,0,.35,'sawtooth',.085,group));
  [523,659,784,659,784,1047].forEach((f,i)=>{note(f,.28+i*.13,.15,'square',.09,group);note(f/2,.28+i*.13,.17,'triangle',.13,group);});
  [523,659,784,1047].forEach(f=>note(f,1.12,.65,'triangle',.14,group));
  [1568,2093].forEach((f,i)=>note(f,1.35+i*.12,.3,'sine',.08,group));
 }else if(kind==='complete'){
  [523,659,784,1047,784,1047,1319].forEach((f,i)=>note(f,i*.075,.13,'triangle',.18,group));
  [262,330,392].forEach(f=>note(f,.1,.35,'square',.06,group));note(2093,.46,.3,'sine',.10,group);
 }else{
  [523,659,784].forEach((f,i)=>note(f,.08+i*.08,.17,'triangle',.19,group));note(1568,.30,.24,'sine',.12,group);note(2093,.38,.28,'sine',.09,group);
 }
}
function updateSoundButton(){$('sound').querySelector('span').textContent=sound?'ON':'OFF';$('sound').setAttribute('aria-label','効果音を'+(sound?'オフ':'オン')+'にする');$('sound').setAttribute('aria-pressed',String(sound));}
$('sound').onclick=()=>{sound=!sound;state.sound=sound;save();updateSoundButton();if(sound){ensureAudio();note(659,0,.1);note(988,.09,.13);}else stopSounds();};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const praise=['社長、本日も見事な仕事ぶりです。','素晴らしい成果です、社長。','またひとつ、会社が成長しました。','本日の業務、無事完遂。','この調子で世界を取りにいきましょう。','小さな「できた」が、会社を育てる。','取締役会、満場一致で拍手です。','この一歩、弊社にとっては大きな一歩。','歯磨き級の一歩にも、全社を挙げて拍手。'];
let lastPraise=-1;
function compliment(){let i;do{i=Math.floor(Math.random()*praise.length);}while(i===lastPraise);lastPraise=i;return praise[i];}
function paperShower(kind,amount,active){
 if(reduced)return;const c=$('confetti'),ctx=c.getContext('2d');if(!ctx)return;const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const colors=kind==='level'?['#d4ac54','#be4b35','#fff8e6','#789883']:['#fffaf0','#eee4cc','#e8d6b4','#f8f3e7'];
 const pieces=Array.from({length:amount},(_,i)=>({x:kind==='order'?w*.8:w/2,y:kind==='level'?h*.2:h*.47,vx:(Math.random()-.5)*(kind==='level'?19:15),vy:-Math.random()*16-2,rot:Math.random()*6,size:kind==='level'?4+Math.random()*6:9+Math.random()*13,color:colors[i%colors.length]}));let start,previous;
 function frame(t){if(!active())return;start??=t;const dt=Math.min((t-(previous||t))/16.67,2);previous=t;ctx.clearRect(0,0,w,h);for(const p of pieces){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.18*dt;p.rot+=.055*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*(kind==='level'?.4:1.3));if(kind!=='level'){ctx.strokeStyle='#aaa28a';ctx.lineWidth=.6;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-p.size*.3,-p.size*.2+j*3);ctx.lineTo(p.size*.3,-p.size*.2+j*3);ctx.stroke();}}ctx.restore();}if(t-start<2400)requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}
function celebrate(kind,name,value,from,difficulty='normal'){
 return new Promise(resolve=>{
  const overlay=$('celebration'),isOrder=kind==='order',isLevel=kind==='level',hard=difficulty==='hard';let active=true;const timers=[],music=new Set();
  const later=(fn,ms)=>timers.push(setTimeout(()=>{if(active)fn();},ms));
  const finish=()=>{if(!active)return;active=false;timers.forEach(clearTimeout);stopSounds(music);overlay.hidden=true;overlay.onclick=null;overlay.onkeydown=null;document.querySelector('.app').inert=false;const ctx=$('confetti').getContext('2d');if(ctx)ctx.clearRect(0,0,$('confetti').width,$('confetti').height);if(navigator.vibrate)navigator.vibrate(0);resolve();};
  overlay.className='celebration '+(isOrder?'order':isLevel?'levelup':'complete')+' difficulty-'+difficulty+' anticipatory';overlay.hidden=false;document.querySelector('.app').inert=true;
  $('event-intro').textContent=isOrder?'営業部より、緊急連絡。':isLevel?'臨時取締役会、開会。':'経理部より、重要なご報告。';
  $('event-company').textContent=state.companyName;$('event-date').textContent=localDate().replaceAll('-','.');
  $('event-ribbon').textContent=isOrder?(hard?'特別号外':difficulty==='normal'?'号外・大型受注':'号外'):isLevel?'増築のお知らせ':'売上計上';
  $('celebrate-kicker').textContent=isOrder?'営業部発行 ／ 全社員必読':isLevel?'社内報 ／ 会社成長 特別号':'経理部発行 ／ 業務実績報告';
  $('celebrate-title').textContent=isOrder?(hard?'特別案件\n受注決定！':'受注\n決定！'):isLevel?'社屋増築\n決定！':'本日の案件\n見事に完遂。';
  $('celebrate-icon').textContent=isOrder?'受注':isLevel?'祝 増築':'完遂';$('project-label').textContent=isLevel?'総務部より、社長へ':'対象案件';$('celebrate-name').textContent=name;
  $('celebrate-message').textContent=isOrder?'完了時の報酬。さあ、ひと仕事！':isLevel?'あなたの会社が少し大きくなりました。':compliment();
  $('celebrate-hint').textContent=isOrder?'営業部一同、期待しております。':isLevel?'小さな会社、大きな一歩。':'本日の売上 +'+value.toLocaleString()+' EXP';
  $('reward').replaceChildren();const label=document.createElement('small'),number=document.createElement('span'),unit=document.createElement('small');label.textContent=isLevel?'会社成長、正式決定':isOrder?'獲得予定実績':'今回の売上';number.textContent=isLevel?'Lv.'+from+' → Lv.'+value:'+0';unit.textContent=isLevel?(value===2?'観葉植物、導入決裁済み。':value===3?'PC・棚、導入決裁済み。':'さらなる成長、全社でお祝い。'):'COMPANY EXP';$('reward').append(label,number,unit);
  overlay.onclick=finish;overlay.onkeydown=e=>{if(['Escape','Enter',' '].includes(e.key)){e.preventDefault();finish();}};overlay.focus();
  const anticipation=isOrder?(hard?650:difficulty==='normal'?480:420):isLevel?650:400;
  entranceSound(kind,anticipation,music);
  const reveal=()=>{
   overlay.classList.remove('anticipatory');overlay.classList.add('impact');resultSound(kind,music);
   if(navigator.vibrate&&!reduced)navigator.vibrate(isLevel?[35,45,50,45,90]:isOrder?[20,35,30]:[40,30,70]);
   const amount=isLevel?140:isOrder?(hard?36:difficulty==='normal'?24:14):(hard?60:difficulty==='normal'?42:26);paperShower(kind,amount,()=>active);
   if(!isLevel)later(()=>{const start=performance.now();let lastTick=-100;function tick(now){if(!active)return;const p=reduced?1:Math.min((now-start)/720,1);number.textContent='+'+Math.round(value*(1-Math.pow(1-p,3))).toLocaleString();if(now-lastTick>85&&p<1){note(800+p*700,0,.045,'sine',.07,music);lastTick=now;}if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);},300);
   later(()=>{overlay.classList.add('settled');if(!isLevel){note(784,0,.12,'triangle',.17,music);note(1047,.06,.2,'triangle',.15,music);}},1120);
  };
  later(reveal,anticipation);later(finish,reduced?anticipation+1800:isOrder?(hard?3000:2750):isLevel?3500:3200);
 });
}
function tweenGrowth(from,to,duration=650){return new Promise(resolve=>{if(reduced||from===to){render(to);resolve();return;}const start=performance.now();$('progress').style.transition='none';function frame(now){const p=Math.min((now-start)/duration,1),exp=Math.round(from+(to-from)*(1-Math.pow(1-p,3))),g=growth(exp);$('exp').textContent=g.remaining.toLocaleString();$('progress').style.width=g.remaining/g.cost*100+'%';$('percent').textContent=Math.floor(g.remaining/g.cost*100)+'%';if(p<1)requestAnimationFrame(frame);else{$('progress').style.transition='';render(to);resolve();}}requestAnimationFrame(frame);});}
async function animateHome(from,to){const old=growth(from),next=growth(to);render(from);if(next.level>old.level&&!reduced){const boundary=from+old.cost-old.remaining;await tweenGrowth(from,boundary-1,520);$('exp').textContent=old.cost.toLocaleString();$('progress').style.width='100%';await wait(160);render(boundary);await tweenGrowth(boundary,to,620);}else await tweenGrowth(from,to,850);}
function selectDeadline(choice){
 deadlineChoice=choice;for(const button of document.querySelectorAll('[data-deadline]'))button.setAttribute('aria-pressed',String(button.dataset.deadline===choice));
 $('custom-date-wrap').hidden=choice!=='custom';const value=choice==='custom'?$('deadline-date').value:quickDeadline(choice),due=deadlineInfo(value);
 $('deadline-summary').textContent=due?due.label:choice==='custom'?'カレンダーから日付を選べます。':'締切なし。社長のペースで。';$('clear-deadline').hidden=!choice;
}
for(const button of document.querySelectorAll('[data-deadline]'))button.onclick=()=>{selectDeadline(deadlineChoice===button.dataset.deadline?null:button.dataset.deadline);if(deadlineChoice==='custom'){const input=$('deadline-date');input.focus();try{input.showPicker?.();}catch{}}};
$('deadline-date').onchange=()=>selectDeadline('custom');$('clear-deadline').onclick=()=>{$('deadline-date').value='';selectDeadline(null);};
$('new-task').onclick=()=>{if(busy||!state.established)return;selectDeadline(null);$('new-dialog').showModal();setTimeout(()=>$('task-name').focus(),60);};
$('close-dialog').onclick=()=>$('new-dialog').close();
$('new-dialog').onclick=e=>{if(e.target===$('new-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
$('task-form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;const name=$('task-name').value.trim();if(!name){$('task-name').setCustomValidity('案件名を入力してください');$('task-name').reportValidity();return;}
 const difficulty=new FormData(e.target).get('difficulty')||'normal',deadline=deadlineChoice==='custom'?$('deadline-date').value:quickDeadline(deadlineChoice);
 if(deadline&&!parseDate(deadline)){$('deadline-date').reportValidity();return;}
 busy=true;ensureAudio();const id=globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random();state.tasks.push({id,name,difficulty,deadline:deadline||null});save();$('new-dialog').close();e.target.reset();selectDeadline(null);render();
 try{await celebrate('order',name,difficulties[difficulty].exp,undefined,difficulty);}finally{busy=false;$('new-task').focus();}
};$('task-name').oninput=()=>$('task-name').setCustomValidity('');
async function complete(id){
 if(busy)return;const index=state.tasks.findIndex(t=>t.id===id);if(index<0)return;busy=true;ensureAudio();daily();const task=state.tasks[index],d=difficulties[task.difficulty],previousExp=state.exp,old=growth(previousExp).level;
 state.tasks.splice(index,1);state.exp+=d.exp;state.today++;state.sales+=d.exp;save();
 try{if(!reduced)await wait(90);await celebrate('complete',task.name,d.exp,undefined,task.difficulty);const next=growth(state.exp).level;if(next>old)await celebrate('level','おめでとう、社長！',next,old,task.difficulty);await animateHome(previousExp,state.exp);$('today').parentElement.classList.remove('pop');void $('today').offsetWidth;$('today').parentElement.classList.add('pop');}
 finally{busy=false;render();($('tasks').querySelector('button')||$('new-task')).focus();}
}
function openCompany(mode){
 if(busy)return;companyMode=mode;const founding=mode==='found';$('company-dialog-title').textContent=founding?'あなたの会社を設立しましょう。':'会社名を変更する';$('company-dialog-note').textContent=founding?'社長も社員も、あなた。可能性は無限大。':'新しい看板で、いつもの会社を続けましょう。';$('company-input').value=state.companyName;$('company-submit').textContent=founding?'会社を設立する':'社名変更を届け出る';$('close-company').hidden=founding;$('company-dialog').showModal();
}
$('general-affairs').onclick=()=>openCompany('rename');$('close-company').onclick=()=>$('company-dialog').close();$('company-dialog').oncancel=e=>{if(companyMode==='found')e.preventDefault();};
$('company-form').onsubmit=e=>{e.preventDefault();const name=$('company-input').value.trim();if(!name){$('company-input').setCustomValidity('会社名を入力してください');$('company-input').reportValidity();return;}state.companyName=name;state.established=true;save();$('company-dialog').close();render();$('general-affairs').focus();};$('company-input').oninput=()=>$('company-input').setCustomValidity('');
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy)render();});
updateSoundButton();selectDeadline(null);render();if(!state.established)openCompany('found');
