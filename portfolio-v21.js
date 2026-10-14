const dialog=document.querySelector('#art-dialog'),enlarged=document.querySelector('#enlarged'),description=document.querySelector('#card-description'),previous=document.querySelector('.dialog-prev'),next=document.querySelector('.dialog-next');
const cards=[...document.querySelectorAll('[data-project]')];
const renders=['assets/blacksmith-morning-v21.png','assets/blacksmith-night-v21.png','assets/blacksmith-candle.png','assets/blacksmith-furnace.png'],hero=document.querySelector('#hero'),thumbs=document.querySelector('.thumbnails');
let zoom=1,projectHref=null,renderIndex=0,renderPreview=false;
function resetZoom(){zoom=1;enlarged.style.setProperty('--zoom',zoom)}
function openArtwork(img){dialog.classList.remove('project-view');description.hidden=true;projectHref=null;renderPreview=img===hero;previous.setAttribute('aria-label','Previous render');next.setAttribute('aria-label','Next render');previous.hidden=next.hidden=!renderPreview;enlarged.removeAttribute('role');enlarged.removeAttribute('tabindex');enlarged.src=img.src;enlarged.alt=img.alt;resetZoom();if(!dialog.open)openPreview();clearInterval(autoplayTimer);requestAnimationFrame(positionRenderArrows)}
function showCard(index){const card=cards[index];dialog.classList.add('project-view');renderPreview=false;dialog.classList.remove('render-view');projectHref=card.href;previous.hidden=next.hidden=true;enlarged.src=card.dataset.fullSrc||card.querySelector('img').src;enlarged.alt=card.dataset.title;enlarged.setAttribute('role','link');enlarged.tabIndex=0;description.hidden=false;description.querySelector('h2').textContent=card.dataset.title;description.querySelector('a').href=card.href;resetZoom();if(!dialog.open)openPreview();clearInterval(autoplayTimer);requestAnimationFrame(positionRenderArrows)}
cards.forEach((card,index)=>card.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();showCard(index)}));
enlarged.addEventListener('click',event=>{if(isEmptyPixel(event)){closePreview();return}if(projectHref)navigateTo(projectHref)});
enlarged.addEventListener('keydown',event=>{if(projectHref&&event.key==='Enter'){event.preventDefault();navigateTo(projectHref)}});
dialog.addEventListener('wheel',event=>{if(event.ctrlKey)return;event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);zoom=Math.min(4,Math.max(1,zoom*Math.exp(-delta*.0015)));enlarged.style.setProperty('--zoom',zoom)},{passive:false});
document.querySelectorAll('.artwork').forEach(button=>button.addEventListener('click',()=>openArtwork(button.querySelector('img'))));
document.querySelector('.close').addEventListener('click',()=>closePreview());
dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.classList.contains('dialog-content')||event.target.classList.contains('image-stage'))closePreview()});
dialog.addEventListener('close',resetZoom);
let slideGeneration=0;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const imageLoads=new Map(),slideTickets=new WeakMap();
function readyImage(src){if(!imageLoads.has(src)){const img=new Image();img.src=src;imageLoads.set(src,img.decode().then(()=>true).catch(()=>false))}return imageLoads.get(src)}
async function slideImage(img,src,direction){
 const ticket=(slideTickets.get(img)||0)+1;slideTickets.set(img,ticket);
 if(!await readyImage(src)||slideTickets.get(img)!==ticket)return;
 const parent=img.parentElement;
 img.getAnimations().forEach(animation=>animation.cancel());
 parent.querySelectorAll('.slide-copy').forEach(node=>node.remove());
 if(reduceMotion.matches||!img.complete||img.src.endsWith(src)){img.src=src;return}
 const old=img.cloneNode();old.removeAttribute('id');old.removeAttribute('role');old.removeAttribute('tabindex');old.setAttribute('aria-hidden','true');old.classList.add('slide-copy');parent.append(old);img.src=src;
 const options={duration:650,easing:'cubic-bezier(.22,.61,.36,1)'};
 const distance=parent.clientWidth*.1*direction;
 const base=img===enlarged?`scale(${zoom})`:'';
 img.animate([{transform:`translateX(${distance}px) ${base}`,opacity:0},{transform:`translateX(0) ${base}`,opacity:1}],options);
 old.animate([{transform:`translateX(0) ${base}`,opacity:1},{transform:`translateX(${-distance}px) ${base}`,opacity:0}],options).finished.then(()=>old.remove()).catch(()=>old.remove());
}
function showRender(index){const direction=index<renderIndex?-1:1;renderIndex=(index+renders.length)%renders.length;slideImage(hero,renders[renderIndex],direction);hero.alt=`Blacksmith Workshop — ${['Morning','Night','Candle','Furnace'][renderIndex]}`;[...thumbs.children].forEach((button,i)=>button.setAttribute('aria-current',String(i===renderIndex)));document.querySelector('#gallery-status').textContent=`Image ${renderIndex+1} of 4`;if(dialog.open&&renderPreview){resetZoom();slideImage(enlarged,renders[renderIndex],direction);enlarged.alt=hero.alt}restartAutoplay()}
let autoplayTimer;
function restartAutoplay(){clearInterval(autoplayTimer);if(hero&&!document.hidden&&!dialog.open&&!reduceMotion.matches)autoplayTimer=setInterval(()=>showRender(renderIndex+1),5000)}
document.addEventListener('visibilitychange',restartAutoplay);dialog.addEventListener('close',restartAutoplay);reduceMotion.addEventListener('change',restartAutoplay);
previous.addEventListener('click',()=>{if(renderPreview)showRender(renderIndex-1)});next.addEventListener('click',()=>{if(renderPreview)showRender(renderIndex+1)});
dialog.addEventListener('keydown',event=>{if(renderPreview&&['ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();showRender(renderIndex+(event.key==='ArrowRight'?1:-1))}});
if(hero){renders.forEach((src,index)=>{const button=document.createElement('button');button.setAttribute('aria-label',`Show render ${index+1}`);const img=document.createElement('img');img.src=src;img.alt='';button.append(img);button.addEventListener('click',()=>showRender(index));thumbs.append(button)});showRender(0);document.querySelector('.previous').addEventListener('click',()=>showRender(renderIndex-1));document.querySelector('.next').addEventListener('click',()=>showRender(renderIndex+1));document.querySelector('.render').addEventListener('click',()=>openArtwork(hero));document.querySelector('.gallery').addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();showRender(renderIndex+(event.key==='ArrowRight'?1:-1))}});document.querySelectorAll('.zoom').forEach(img=>{img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',`Enlarge ${img.alt}`);img.addEventListener('click',()=>openArtwork(img));img.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openArtwork(img)}})})}

// Hit-test transparency and edge-connected black backdrop without changing artwork.
const masks=new Map();let mask=null;
function buildMask(){
 const key=enlarged.currentSrc||enlarged.src;if(masks.has(key)){mask=masks.get(key);return}
 if(!enlarged.naturalWidth)return;
 const canvas=document.createElement('canvas');const ratio=Math.min(1,1024/enlarged.naturalWidth);canvas.width=Math.round(enlarged.naturalWidth*ratio);canvas.height=Math.round(enlarged.naturalHeight*ratio);
 try{const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(enlarged,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;const w=canvas.width,h=canvas.height,empty=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const eligible=i=>pixels[i*4+3]<24||(pixels[i*4]<5&&pixels[i*4+1]<5&&pixels[i*4+2]<5);
 function add(i){if(!empty[i]&&eligible(i)){empty[i]=1;queue[tail++]=i}}
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}
 while(head<tail){const i=queue[head++],x=i%w;if(x)add(i-1);if(x<w-1)add(i+1);if(i>=w)add(i-w);if(i<w*(h-1))add(i+w)}
 for(let i=0;i<w*h;i++)if(pixels[i*4+3]<24)empty[i]=1;
 mask={w,h,empty,key};masks.set(key,mask);
 }catch{mask=null}
}
enlarged.addEventListener('load',()=>{buildMask();positionRenderArrows()});
function isEmptyPixel(event){if(!mask||mask.key!==(enlarged.currentSrc||enlarged.src))buildMask();if(!mask)return false;const rect=enlarged.getBoundingClientRect();const fit=Math.min(rect.width/enlarged.naturalWidth,rect.height/enlarged.naturalHeight),w=enlarged.naturalWidth*fit,h=enlarged.naturalHeight*fit,left=rect.left+(rect.width-w)/2,top=rect.top+(rect.height-h)/2;if(event.clientX<left||event.clientX>left+w||event.clientY<top||event.clientY>top+h)return true;const x=Math.floor((event.clientX-left)/w*mask.w),y=Math.floor((event.clientY-top)/h*mask.h);return x>=0&&y>=0&&x<mask.w&&y<mask.h&&mask.empty[y*mask.w+x]===1}
function positionRenderArrows(){
 dialog.classList.toggle('render-view',renderPreview);
 if(renderPreview){previous.hidden=next.hidden=false}
 for(const button of [previous,next]){button.style.removeProperty('left');button.style.removeProperty('right');button.style.removeProperty('top')}
}
window.addEventListener('resize',positionRenderArrows);

let closingPreview=false,navigating=false;
function openPreview(){
 closingPreview=false;dialog.classList.remove('closing');dialog.showModal();
 if(!reduceMotion.matches){dialog.classList.add('opening');dialog.querySelector('.dialog-content').animate([{opacity:0,transform:'scale(.97)'},{opacity:1,transform:'scale(1)'}],{duration:300,easing:'cubic-bezier(.22,.61,.36,1)'});setTimeout(()=>dialog.classList.remove('opening'),300)}
}
async function closePreview(){
 if(closingPreview||!dialog.open)return;closingPreview=true;
 if(!reduceMotion.matches){dialog.classList.add('closing');await dialog.querySelector('.dialog-content').animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.97)'}],{duration:200,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{})}
 dialog.close();dialog.querySelector('.dialog-content').getAnimations().forEach(a=>a.cancel());dialog.classList.remove('closing','opening');closingPreview=false;
}
dialog.addEventListener('cancel',event=>{event.preventDefault();closePreview()});
function navigateTo(url){if(navigating)return;navigating=true;if(reduceMotion.matches){location.href=url;return}document.documentElement.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'}).finished.then(()=>location.href=url)}
document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.target||link.download||link.getAttribute('href').startsWith('#'))return;const url=new URL(link.href);if(url.origin!==location.origin||!url.pathname.endsWith('.html'))return;event.preventDefault();navigateTo(url.href)});
window.addEventListener('pageshow',()=>{navigating=false;document.documentElement.getAnimations().forEach(a=>a.cancel())});
