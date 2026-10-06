'use strict';
// Ceremony and synthesized audio layer; controller supplies current company/settings.
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
 const colors=kind==='level'?['#fcba03','#b68a21','#fff9ed','#dccba0']:['#fff9ed','#f7f1e1','#e7d6ad','#f0e4c8'];
 const pieces=Array.from({length:amount},(_,i)=>({x:kind==='order'?w*.8:w/2,y:kind==='level'?h*.2:h*.47,vx:(Math.random()-.5)*(kind==='level'?19:15),vy:-Math.random()*16-2,rot:Math.random()*6,size:kind==='level'?4+Math.random()*6:9+Math.random()*13,color:colors[i%colors.length]}));let start,previous;
 function frame(t){if(!active()){ctx.clearRect(0,0,w,h);return;}start??=t;const dt=Math.min((t-(previous||t))/16.67,2);previous=t;ctx.clearRect(0,0,w,h);for(const p of pieces){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.18*dt;p.rot+=.055*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*(kind==='level'?.4:1.3));if(kind!=='level'){ctx.strokeStyle='#aaa28a';ctx.lineWidth=.6;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-p.size*.3,-p.size*.2+j*3);ctx.lineTo(p.size*.3,-p.size*.2+j*3);ctx.stroke();}}ctx.restore();}if(t-start<2400)requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}
function celebrate(kind,name,value,from,difficulty='normal',closeLabel='閉じる'){
 return new Promise(resolve=>{
  const overlay=$('celebration'),isOrder=kind==='order',isLevel=kind==='level',hard=difficulty==='hard';let active=true,ready=false;const timers=[],music=new Set();
  const later=(fn,ms)=>timers.push(setTimeout(()=>{if(active)fn();},ms));
  const finish=()=>{if(!active)return;active=false;timers.forEach(clearTimeout);stopSounds(music);overlay.hidden=true;document.body.classList.remove('event-open');overlay.onkeydown=null;$('event-close').onclick=null;$('event-skip').onclick=null;document.querySelector('.app').inert=false;const ctx=$('confetti').getContext('2d');if(ctx)ctx.clearRect(0,0,$('confetti').width,$('confetti').height);CompanyPlatform.haptic(0);resolve();};
  overlay.className='celebration '+(isOrder?'order':isLevel?'levelup':'complete')+' difficulty-'+difficulty+' anticipatory'+(reduced?' calm':'');overlay.hidden=false;document.body.classList.add('event-open');document.querySelector('.app').inert=true;$('event-close').hidden=true;$('event-close-note').hidden=true;$('event-skip').hidden=false;$('event-close').textContent=closeLabel;$('event-close-note').textContent=closeLabel==='閉じる'?'本社へ戻ります。':'会社を挙げて、もうひとつお知らせです。';
  $('event-intro').textContent=isOrder?'営業部より、緊急連絡。':isLevel?'臨時取締役会、開会。':'経理部より、重要なご報告。';
  $('event-company').textContent=state.companyName;$('event-date').textContent=localDate().replaceAll('-','.');
  $('event-ribbon').textContent=isOrder?(hard?'特別号外':difficulty==='normal'?'号外・大型受注':'号外'):isLevel?'増築のお知らせ':'売上計上';
  $('celebrate-kicker').textContent=isOrder?'営業部発行 ／ 全社員必読':isLevel?'社内報 ／ 会社成長 特別号':'経理部発行 ／ 業務実績報告';
  $('celebrate-title').textContent=isOrder?(hard?'特別案件\n受注決定！':'受注\n決定！'):isLevel?'社屋増築\n決定！':'本日の案件\n見事に完遂。';
  $('celebrate-icon').textContent=isOrder?'受注':isLevel?'祝 増築':'完遂';$('project-label').textContent=isLevel?'総務部より、社長へ':'対象案件';$('celebrate-name').textContent=name;
  $('celebrate-message').textContent=isOrder?'完了時の報酬。さあ、ひと仕事！':isLevel?'あなたの会社が少し大きくなりました。':compliment();
  $('celebrate-hint').textContent=isOrder?'営業部一同、期待しております。':isLevel?'小さな会社、大きな一歩。':'本日の売上 +'+value.toLocaleString()+' EXP';
  $('reward').replaceChildren();const label=document.createElement('small'),number=document.createElement('span'),unit=document.createElement('small');label.textContent=isLevel?'会社成長、正式決定':isOrder?'獲得予定実績':'今回の売上';number.textContent=isLevel?'Lv.'+from+' → Lv.'+value:'+0';unit.textContent=isLevel?(value===2?'観葉植物、導入決裁済み。':value===3?'PC・棚、導入決裁済み。':'さらなる成長、全社でお祝い。'):'COMPANY EXP';$('reward').append(label,number,unit);
  const settle=(fastForward=false)=>{if(!active||ready)return;ready=true;timers.forEach(clearTimeout);overlay.classList.remove('anticipatory');overlay.classList.add('impact','settled');if(fastForward){overlay.classList.add('fast-forward');stopSounds(music);}number.textContent=isLevel?'Lv.'+from+' → Lv.'+value:'+'+value.toLocaleString();$('event-skip').hidden=true;$('event-close').hidden=false;$('event-close-note').hidden=false;fitCelebration();$('event-close').focus({preventScroll:true});};
  $('event-close').onclick=()=>{if(ready)finish();};$('event-skip').onclick=()=>settle(true);
  overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();if(!ready)settle(true);else $('event-close').focus();}};overlay.focus();
  const anticipation=isOrder?(hard?1450:difficulty==='normal'?1250:1100):isLevel?1450:1200;
  entranceSound(kind,anticipation,music);
  const reveal=()=>{
   overlay.classList.remove('anticipatory');overlay.classList.add('impact');resultSound(kind,music);
   if(!reduced)CompanyPlatform.haptic(isLevel?[35,45,50,45,90]:isOrder?[20,35,30]:[40,30,70]);
   const amount=isLevel?140:isOrder?(hard?36:difficulty==='normal'?24:14):(hard?60:difficulty==='normal'?42:26);paperShower(kind,amount,()=>active&&!ready);
   if(!isLevel)later(()=>{const start=performance.now();let lastTick=-100;function tick(now){if(!active||ready)return;const p=reduced?1:Math.min((now-start)/1400,1);number.textContent='+'+Math.round(value*(1-Math.pow(1-p,3))).toLocaleString();if(now-lastTick>85&&p<1){note(800+p*700,0,.045,'sine',.07,music);lastTick=now;}if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);},550);
   later(()=>{settle();if(!isLevel){note(784,0,.12,'triangle',.17,music);note(1047,.06,.2,'triangle',.15,music);}},reduced?900:isLevel?2400:2150);
  };
  later(reveal,anticipation);
 });
}

// Scale the paper independently of its arrival/stamp animations. Reserve the
// action row first, and measure the real visible viewport (Safari browser bars).
function fitCelebration(){
 const overlay=$('celebration');if(overlay.hidden)return;
 const viewport=window.visualViewport;
 overlay.style.setProperty('--event-viewport-height',(viewport?.height||innerHeight)+'px');
 overlay.style.setProperty('--event-viewport-top',(viewport?.offsetTop||0)+'px');
 const slot=overlay.querySelector('.event-paper-slot'),paper=overlay.querySelector('.celebration-content');
 const available=Math.max(1,slot.clientHeight-20),width=Math.max(1,slot.clientWidth-20);
 const scale=Math.min(1,available/(paper.offsetHeight+16),width/(paper.offsetWidth+16));
 overlay.querySelector('.event-paper-fit').style.setProperty('--paper-scale',scale);
}
const eventResizeObserver=new ResizeObserver(()=>requestAnimationFrame(fitCelebration));
eventResizeObserver.observe(document.querySelector('.event-paper-slot'));
eventResizeObserver.observe(document.querySelector('.celebration-content'));
window.addEventListener('resize',fitCelebration);
window.visualViewport?.addEventListener('resize',fitCelebration);
window.visualViewport?.addEventListener('scroll',fitCelebration);
document.fonts?.ready.then(fitCelebration);
