const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:390,height:660},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.APP_URL||'http://127.0.0.1:8773');await page.locator('#company-submit').click();
for(const size of [{width:390,height:660},{width:320,height:480},{width:568,height:320},{width:430,height:740}]){
 await page.setViewportSize(size);
 for(const kind of ['order','complete','level']){
  await page.evaluate(kind=>{celebrate(kind,'ふかふかな布団でおやすみ。社長の長い案件名も大切に記録する',kind==='level'?3:800,2,'hard');},kind);
  await page.locator('#event-skip').click();await page.waitForTimeout(100);
  const result=await page.evaluate(()=>{const overlay=document.getElementById('celebration'),close=document.getElementById('event-close'),paper=overlay.querySelector('.celebration-content'),b=close.getBoundingClientRect(),p=paper.getBoundingClientRect();return{button:{top:b.top,bottom:b.bottom,height:b.height},paper:{top:p.top,bottom:p.bottom,left:p.left,right:p.right},hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===close,width:innerWidth,height:innerHeight};});
  if(!result.hit||result.button.bottom>size.height||result.button.height<44||result.paper.top<0||result.paper.bottom>result.button.top||result.paper.left<0||result.paper.right>size.width)throw Error(JSON.stringify({size,kind,result}));
  if(size.width===390&&kind==='complete')await page.screenshot({path:__dirname+'/event-fit-v7.png'});
  await page.locator('#event-close').click();
 }
}
// Resizing while the result is open must re-fit the paper and retain the close control.
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{celebrate('complete','歯磨きする',300);});await page.waitForTimeout(3800);await page.setViewportSize({width:390,height:550});await page.waitForTimeout(150);const hit=await page.locator('#event-close').evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e;});if(!hit)throw Error('dynamic viewport close inaccessible');await page.locator('#event-close').click();if(errors.length)throw Error(errors.join());console.log('All three ceremonies fit short, portrait, landscape and resized viewports; close stays >=44px and above navigation.');await browser.close();})();
