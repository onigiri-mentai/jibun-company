'use strict';
const $ = id => document.getElementById(id);
const STORAGE = 'jibun-company-v1';
const difficulties = {easy:{name:'かんたん',exp:300,icon:'sun'},normal:{name:'ふつう',exp:500,icon:'case'},hard:{name:'がんばる',exp:800,icon:'bolt'}};
let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const {localDate,day,addDays,parseDate,quickDeadline,deadlineInfo,growth}=CompanyDomain;
let state=CompanyDomain.migrate(CompanyStorage.read(),difficulties);reduced=reduced||state.effects==='calm';
let busy=false,sound=state.sound===true,deadlineChoice=null,companyMode='rename';
function daily(){if(state.day!==day()){state.previousDay={day:state.day,count:state.today,exp:state.sales};state.day=day();state.today=0;state.sales=0;}}
function save(){try{CompanyStorage.write(state);}catch{showNotice('保存できませんでした。総務部からデータを書き出してください。');}}
function render(visualExp=state.exp){
 daily();const g=growth(visualExp);
 $('company-name').textContent=state.companyName;$('office-company').textContent=state.companyName+' 本社';
 $('level').textContent=g.level;$('exp').textContent=g.remaining.toLocaleString();$('goal').textContent=g.cost.toLocaleString();$('progress').style.width=g.remaining/g.cost*100+'%';$('percent').textContent=Math.floor(g.remaining/g.cost*100)+'%';
 $('today').textContent=state.today;$('sales').textContent=state.sales.toLocaleString();$('count').textContent=state.tasks.length;
 $('office').className='office '+(g.level>=3?'lv3':g.level===2?'lv2':'');$('unlock').textContent=g.level===1?'観葉植物をお迎え':g.level===2?'PCと棚を導入':'会社がもっと成長';$('office-note').textContent=g.level===1?'小さな一歩から、大きな会社へ。':g.level===2?'緑のあるオフィス。いい感じ。':'社長、会社らしくなってきました。';
 $('history-count').textContent=state.completed.length;
 CompanyScreens.prepareJobs(state);
 $('remaining-exp').textContent=(g.cost-g.remaining).toLocaleString();CompanyScreens.renderHome(state,g);CompanyScreens.renderRecords(state,g);CompanyScreens.renderAdmin(state);

 for(const task of state.tasks){
  const d=difficulties[task.difficulty],due=deadlineInfo(task.deadline),button=document.createElement('button');button.className='task'+(due?.near?' deadline-near':'');
  button.setAttribute('aria-label',task.name+'を案件完遂する。'+(due?due.label+'。':'')+'報酬'+d.exp+' EXP');
  const circle=document.createElement('span');circle.className='check';circle.innerHTML=CompanyIcons.svg('check');
  const details=document.createElement('span');details.className='task-details';const name=document.createElement('span');name.className='task-name';name.textContent=task.name;
  const meta=document.createElement('span');meta.className='task-meta';const badge=document.createElement('span');badge.className='task-difficulty';badge.innerHTML=CompanyIcons.svg(d.icon);badge.append(document.createTextNode(d.name));meta.append(badge);
  if(due){const deadline=document.createElement('span');deadline.className='task-deadline'+(due.overdue?' overdue':'');deadline.textContent=due.label;meta.append(deadline);}
  details.append(name,meta);const reward=document.createElement('span');reward.className='task-exp';reward.textContent='+'+d.exp;const small=document.createElement('small');small.textContent='COMPANY EXP';reward.append(small);
  button.append(circle,details,reward);button.onclick=()=>complete(task.id);const group=CompanyScreens.taskGroup(task.deadline);$('tasks-'+group).append(button);
 }
 if(!state.tasks.length){const e=document.createElement('div');e.className='empty';e.textContent='全案件、完遂。社長、おつかれさまでした。\n営業部は次の受注をお待ちしています。';$('tasks').append(e);}
 renderHistory();CompanyIcons.mount();save();
}
function renderHistory(){
 $('history-company').textContent=state.companyName+' の、これまでの仕事。';$('completed-count').textContent=state.completed.length.toLocaleString();$('completed-sales').textContent=state.exp.toLocaleString();
 $('history-legacy').hidden=state.legacyExp===0;$('history-legacy').textContent='以前の実績 '+state.legacyExp.toLocaleString()+' EXPも引き継いでいます。旧版には案件名の記録がないため、一覧は今回の更新後の達成分から残ります。';
 const list=$('history-list');list.replaceChildren();
 if(!state.completed.length){const empty=document.createElement('div');empty.className='history-empty';const title=document.createElement('h2');title.textContent='まだ、まっさらな実績帳。';const note=document.createElement('p');note.textContent='ひとつ案件を完遂すると、ここに記録されます。歯磨きだって、立派な業務実績です。';empty.append(title,note);list.append(empty);return;}
 let previousDay=null;const today=day(),yesterday=localDate(addDays(new Date(),-1));
 for(const task of [...state.completed].sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt))){
  const date=new Date(task.completedAt),dateKey=localDate(date);
  if(dateKey!==previousDay){const heading=document.createElement('h2');heading.className='history-day';heading.textContent=dateKey===today?'今日の仕事':dateKey===yesterday?'昨日の仕事':`${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日の仕事`;list.append(heading);previousDay=dateKey;}
  const card=document.createElement('article');card.className='history-record';const seal=document.createElement('span');seal.className='history-seal';seal.textContent='完遂';seal.setAttribute('aria-hidden','true');
  const details=document.createElement('div');details.className='history-details';const name=document.createElement('h3');name.textContent=task.name;const meta=document.createElement('p');const difficulty=difficulties[task.difficulty]||difficulties.normal;meta.textContent=`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')} 完遂 ／ ${difficulty.name}`;details.append(name,meta);
  const exp=document.createElement('div');exp.className='history-reward';exp.textContent='+'+task.exp.toLocaleString();const unit=document.createElement('small');unit.textContent='EXP';exp.append(unit);card.append(seal,details,exp);list.append(card);
 }
}
let currentPage='home';
function updateView(){const candidate=location.hash.slice(1);currentPage=['home','jobs','history','admin'].includes(candidate)?candidate:'home';for(const page of ['home','jobs','history','admin'])$(page+'-screen').hidden=page!==currentPage;document.querySelectorAll('[data-page]').forEach(link=>{if(link.dataset.page===currentPage)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});render();window.scrollTo({top:0,behavior:'instant'});}
window.addEventListener('hashchange',updateView);
function showNotice(message){$('notice').textContent=message;$('notice').hidden=false;}
function tweenGrowth(from,to,duration=650){return new Promise(resolve=>{if(reduced||from===to){render(to);resolve();return;}const start=performance.now();$('progress').style.transition='none';function frame(now){const p=Math.min((now-start)/duration,1),exp=Math.round(from+(to-from)*(1-Math.pow(1-p,3))),g=growth(exp);$('exp').textContent=g.remaining.toLocaleString();$('progress').style.width=g.remaining/g.cost*100+'%';$('percent').textContent=Math.floor(g.remaining/g.cost*100)+'%';if(p<1)requestAnimationFrame(frame);else{$('progress').style.transition='';render(to);resolve();}}requestAnimationFrame(frame);});}
async function animateHome(from,to){const old=growth(from),next=growth(to);render(from);if(next.level>old.level&&!reduced){const boundary=from+old.cost-old.remaining;await tweenGrowth(from,boundary-1,520);$('exp').textContent=old.cost.toLocaleString();$('progress').style.width='100%';await wait(160);render(boundary);await tweenGrowth(boundary,to,620);}else await tweenGrowth(from,to,850);}
function selectDeadline(choice){
 deadlineChoice=choice==='none'?null:choice;for(const button of document.querySelectorAll('[data-deadline]'))button.setAttribute('aria-pressed',String((button.dataset.deadline==='none'?null:button.dataset.deadline)===deadlineChoice));
 $('custom-date-wrap').hidden=choice!=='custom';const value=choice==='custom'?$('deadline-date').value:quickDeadline(choice),due=deadlineInfo(value);
 $('deadline-summary').textContent=due?due.label:choice==='custom'?'カレンダーから日付を選べます。':'締切なし。社長のペースで。';$('clear-deadline').hidden=!choice;
}
for(const button of document.querySelectorAll('[data-deadline]'))button.onclick=()=>{selectDeadline(deadlineChoice===button.dataset.deadline?null:button.dataset.deadline);if(deadlineChoice==='custom'){const input=$('deadline-date');input.focus();try{input.showPicker?.();}catch{}}};
$('deadline-date').onchange=()=>selectDeadline('custom');$('clear-deadline').onclick=()=>{$('deadline-date').value='';selectDeadline(null);};
$('new-task').onclick=()=>{if(busy||!state.established)return;selectDeadline(null);$('new-dialog').showModal();$('new-task').setAttribute('aria-expanded','true');setTimeout(()=>$('task-name').focus(),60);};
$('close-dialog').onclick=()=>$('new-dialog').close();$('new-dialog').addEventListener('close',()=>{$('new-task').setAttribute('aria-expanded','false');$('new-task').focus();});
$('new-dialog').onclick=e=>{if(e.target===$('new-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
$('task-form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;const name=$('task-name').value.trim();if(!name){$('task-name').setCustomValidity('案件名を入力してください');$('task-name').reportValidity();return;}
 const difficulty=new FormData(e.target).get('difficulty')||'normal',deadline=deadlineChoice==='custom'?$('deadline-date').value:quickDeadline(deadlineChoice);
 if(deadline&&!parseDate(deadline)){$('deadline-date').reportValidity();return;}
 busy=true;ensureAudio();const id=globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random();CompanyDomain.accept(state,{id,name,difficulty,deadline:deadline||null});save();$('new-dialog').close();e.target.reset();selectDeadline(null);render();
 try{await celebrate('order',name,difficulties[difficulty].exp,undefined,difficulty);}finally{busy=false;$('new-task').focus();}
};$('task-name').oninput=()=>$('task-name').setCustomValidity('');
async function complete(id){
 if(busy)return;const index=state.tasks.findIndex(t=>t.id===id);if(index<0)return;busy=true;ensureAudio();daily();const task=state.tasks[index],d=difficulties[task.difficulty],previousExp=state.exp,old=growth(previousExp).level;
 CompanyDomain.completeProject(state,id,d.exp);save();
 try{if(!reduced)await wait(180);const next=growth(state.exp).level;await celebrate('complete',task.name,d.exp,undefined,task.difficulty,next>old?'会社成長のお知らせへ →':'閉じる');if(next>old)await celebrate('level','おめでとう、社長！',next,old,task.difficulty);location.hash='home';updateView();await animateHome(previousExp,state.exp);$('today').parentElement.classList.remove('pop');void $('today').offsetWidth;$('today').parentElement.classList.add('pop');}
 finally{busy=false;render();$('new-task').focus();}
}
function openCompany(mode){
 if(busy)return;companyMode=mode;const founding=mode==='found';$('company-dialog-title').textContent=founding?'あなたの会社を設立しましょう。':'会社名を変更する';$('company-dialog-note').textContent=founding?'社長も社員も、あなた。可能性は無限大。':'新しい看板で、いつもの会社を続けましょう。';$('company-input').value=state.companyName;$('company-submit').textContent=founding?'会社を設立する':'社名変更を届け出る';$('close-company').hidden=founding;$('company-dialog').showModal();
}
$('general-affairs').onclick=()=>openCompany('rename');$('close-company').onclick=()=>$('company-dialog').close();$('company-dialog').oncancel=e=>{if(companyMode==='found')e.preventDefault();};
$('company-form').onsubmit=e=>{e.preventDefault();const name=$('company-input').value.trim();if(!name){$('company-input').setCustomValidity('会社名を入力してください');$('company-input').reportValidity();return;}state.companyName=name;state.established=true;save();$('company-dialog').close();render();$('general-affairs').focus();};$('company-input').oninput=()=>$('company-input').setCustomValidity('');
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy)render();});
$('effects-setting').onchange=e=>{state.effects=e.target.value;reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||state.effects==='calm';save();};
$('reminders-setting').onchange=e=>{state.reminders=e.target.checked;save();render();};
$('export-data').onclick=()=>{const blob=new Blob([CompanyStorage.export(state)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='jibun-company-backup-'+day()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import-data').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const backup=JSON.parse(await file.text()),data=backup.data;if(backup.format!=='jibun-company'||!data||!Number.isFinite(data.exp)||data.exp<0||!Array.isArray(data.tasks)||!Array.isArray(data.completed)||typeof data.companyName!=='string'||data.tasks.some(t=>!t||typeof t.name!=='string'||!difficulties[t.difficulty])||data.completed.some(t=>!t||typeof t.name!=='string'||!Number.isFinite(t.exp)||!Number.isFinite(Date.parse(t.completedAt))))throw Error();$('restore-summary').textContent=data.companyName+' ／ '+data.tasks.length+'件の進行中案件 ／ '+data.exp.toLocaleString()+' EXP';$('restore-dialog').showModal();$('restore-confirm').onclick=()=>{CompanyStorage.write(data);location.reload();};}catch{showNotice('このファイルは読み込めません。じぶんカンパニーのバックアップを選んでください。');}e.target.value='';};
$('restore-cancel').onclick=()=>$('restore-dialog').close();
