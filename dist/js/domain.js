'use strict';
window.CompanyDomain=(()=>{
function localDate(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
const day = () => localDate();
function addDays(date,days) { const copy=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12);copy.setDate(copy.getDate()+days);return copy; }
function parseDate(value) { if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d,12);return localDate(date)===value?date:null; }
function quickDeadline(option,now=new Date()) { if(option==='today')return localDate(now);if(option==='tomorrow')return localDate(addDays(now,1));if(option==='week')return localDate(addDays(now,(7-now.getDay())%7));return null; }
function deadlineInfo(value,now=new Date()) { const date=parseDate(value);if(!date)return null;const today=localDate(now),tomorrow=quickDeadline('tomorrow',now),label=value===today?'今日まで':value===tomorrow?'明日まで':`${date.getMonth()+1}/${date.getDate()}まで`;return {label:value<today?`${date.getMonth()+1}/${date.getDate()} 締切済み`:label,near:value<=tomorrow,overdue:value<today}; }
function growth(exp){let level=1,cost=1000,remaining=exp;while(remaining>=cost){remaining-=cost;level++;cost=level*1000;}return{level,cost,remaining};}
function migrate(raw,difficulties){
const initial = () => ({exp:0,day:day(),today:0,sales:0,companyName:'株式会社じぶん',established:false,sound:false,completed:[],legacyExp:0,tasks:[{id:'first1',name:'洗濯する',difficulty:'easy'},{id:'first2',name:'メールを返す',difficulty:'normal'},{id:'first3',name:'歯磨きする',difficulty:'easy'}]});
let state=raw;
if(!state||!Number.isFinite(state.exp)||state.exp<0||!Array.isArray(state.tasks))state=initial();
// Existing companies keep their tasks, EXP, and default name without repeating setup.
if(typeof state.companyName!=='string'||!state.companyName.trim())state.companyName='株式会社じぶん';
if(typeof state.established!=='boolean')state.established=true;
state.tasks=state.tasks.filter(t=>t&&typeof t.name==='string').map(t=>({...t,note:typeof t.note==='string'?t.note:'',difficulty:difficulties[t.difficulty]?t.difficulty:'normal',deadline:parseDate(t.deadline)?t.deadline:null}));
// Older versions kept aggregate EXP, but did not store completed project names.
if(!Array.isArray(state.completed)){state.completed=[];state.legacyExp=state.exp;}
state.completed=state.completed.filter(t=>t&&typeof t.name==='string'&&Number.isFinite(t.exp)&&t.exp>=0&&Number.isFinite(new Date(t.completedAt).getTime())).map(t=>({...t,note:typeof t.note==='string'?t.note:''}));
if(!Number.isFinite(state.legacyExp))state.legacyExp=Math.max(0,state.exp-state.completed.reduce((sum,t)=>sum+t.exp,0));
state.effects=state.effects||'full';state.reminders=state.reminders===true;state.growthLog=Array.isArray(state.growthLog)?state.growthLog:[];

return state;
}
function accept(state,task){state.tasks.push(task);}
function editProject(state,id,changes){const task=state.tasks.find(t=>t.id===id);if(!task)return null;Object.assign(task,{name:changes.name,note:changes.note,difficulty:changes.difficulty,deadline:changes.deadline});return task;}
function completeProject(state,id,reward,now=new Date()){const index=state.tasks.findIndex(t=>t.id===id);if(index<0)return null;const task=state.tasks.splice(index,1)[0],old=growth(state.exp).level;state.exp+=reward;state.today++;state.sales+=reward;state.completed.unshift({...task,exp:reward,completedAt:now.toISOString(),companyName:state.companyName});const next=growth(state.exp).level;if(next>old)state.growthLog.unshift({from:old,to:next,occurredAt:now.toISOString()});return task;}
return {migrate,accept,editProject,completeProject,localDate,day,addDays,parseDate,quickDeadline,deadlineInfo,growth};})();
