const dialog=document.querySelector('#art-dialog'),enlarged=document.querySelector('#enlarged'),description=document.querySelector('#card-description'),previous=document.querySelector('.dialog-prev'),next=document.querySelector('.dialog-next');
const cards=[...document.querySelectorAll('[data-project]')];
const renders=['final_morning','final_night','candle','furnace'].map(name=>`assets/blacksmith-${name}.png`),hero=document.querySelector('#hero'),thumbs=document.querySelector('.thumbnails');
let zoom=1,projectHref=null,renderIndex=0,renderPreview=false;
function resetZoom(){zoom=1;enlarged.style.setProperty('--zoom',zoom)}
function openArtwork(img){dialog.classList.remove('project-view');description.hidden=true;projectHref=null;renderPreview=img===hero;previous.setAttribute('aria-label','Previous render');next.setAttribute('aria-label','Next render');previous.hidden=next.hidden=!renderPreview;enlarged.removeAttribute('role');enlarged.removeAttribute('tabindex');enlarged.src=img.src;enlarged.alt=img.alt;resetZoom();if(!dialog.open)dialog.showModal();clearInterval(autoplayTimer)}
function showCard(index){const card=cards[index];dialog.classList.add('project-view');renderPreview=false;projectHref=card.href;previous.hidden=next.hidden=true;enlarged.src=card.dataset.fullSrc||card.querySelector('img').src;enlarged.alt=card.dataset.title;enlarged.setAttribute('role','link');enlarged.tabIndex=0;description.hidden=false;description.querySelector('h2').textContent=card.dataset.title;description.querySelector('a').href=card.href;resetZoom();if(!dialog.open)dialog.showModal();clearInterval(autoplayTimer)}
cards.forEach((card,index)=>card.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();showCard(index)}));
enlarged.addEventListener('click',event=>{if(isEmptyPixel(event)){dialog.close();return}if(projectHref)location.href=projectHref});
enlarged.addEventListener('keydown',event=>{if(projectHref&&event.key==='Enter'){event.preventDefault();location.href=projectHref}});
dialog.addEventListener('wheel',event=>{if(event.ctrlKey)return;event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);zoom=Math.min(4,Math.max(1,zoom*Math.exp(-delta*.0015)));enlarged.style.setProperty('--zoom',zoom)},{passive:false});
document.querySelectorAll('.artwork').forEach(button=>button.addEventListener('click',()=>openArtwork(button.querySelector('img'))));
document.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.classList.contains('dialog-content')||event.target.classList.contains('image-stage'))dialog.close()});
dialog.addEventListener('close',resetZoom);
let slideGeneration=0;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function slideImage(img,src,direction){
 const old=img.cloneNode();old.removeAttribute('id');old.removeAttribute('role');old.removeAttribute('tabindex');old.setAttribute('aria-hidden','true');old.classList.add('slide-copy');
 const parent=img.parentElement;
 if(reduceMotion.matches||!img.complete||img.src.endsWith(src)){img.src=src;return}
 parent.querySelectorAll('.slide-copy').forEach(node=>node.remove());
 parent.append(old);img.src=src;
 const animationOptions={duration:480,easing:'cubic-bezier(.22,.61,.36,1)'};
 const distance=parent.clientWidth*direction;
 const base=img===enlarged?`scale(${zoom})`:'';
 img.animate([{transform:`translateX(${distance}px) ${base}`,opacity:0},{transform:`translateX(0) ${base}`,opacity:1}],animationOptions);
 old.animate([{transform:`translateX(0) ${base}`,opacity:1},{transform:`translateX(${-distance}px) ${base}`,opacity:0}],animationOptions).finished.then(()=>old.remove()).catch(()=>old.remove());
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
function isEmptyPixel(event){if(!mask||mask.key!==(enlarged.currentSrc||enlarged.src))buildMask();if(!mask)return false;const rect=enlarged.getBoundingClientRect();const x=Math.floor((event.clientX-rect.left)/rect.width*mask.w),y=Math.floor((event.clientY-rect.top)/rect.height*mask.h);return x>=0&&y>=0&&x<mask.w&&y<mask.h&&mask.empty[y*mask.w+x]===1}
function positionRenderArrows(){if(!renderPreview)return;const rect=enlarged.getBoundingClientRect();const width=window.innerWidth;previous.style.left=`${Math.max(20,rect.left-58)}px`;next.style.right=`${Math.max(20,width-rect.right-58)}px`}
window.addEventListener('resize',positionRenderArrows);
