(()=>{
const video=document.querySelector('#scene-video'),slider=document.querySelector('#scene-time'),start=document.querySelector('.scene-start');
let loaded=false,pendingTime=null,inView=false,frame=0,scrubbing=false;
const duration=()=>Number.isFinite(video.duration)?video.duration:30;
function load(){if(!loaded){loaded=true;video.src=video.dataset.src;video.load()}}
function paint(t){slider.max=duration();slider.value=t;slider.style.setProperty('--progress',`${t/duration()*100}%`);slider.setAttribute('aria-valuetext',`${t<10?'Morning':t<18.3?'Day':t<21.7?'Afternoon / Sunset':'Night'}, ${t.toFixed(1)} seconds`)}
function sync(){if(!scrubbing)paint(video.currentTime)}
function tick(){sync();if(!video.paused)frame=requestAnimationFrame(tick)}
async function play(){load();if(scrubbing)return;try{await video.play();start.hidden=true}catch{start.hidden=false}}
function seek(t){load();t=Math.max(0,Math.min(t,duration()-.001));paint(t);if(video.readyState>=1)video.currentTime=t;else pendingTime=t}
function pointerTime(event){const box=slider.getBoundingClientRect();return Math.max(0,Math.min(1,(event.clientY-box.top)/box.height))*duration()}
slider.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();scrubbing=true;video.pause();slider.focus();slider.setPointerCapture(event.pointerId);seek(pointerTime(event))});
slider.addEventListener('pointermove',event=>{if(scrubbing){event.preventDefault();seek(pointerTime(event))}});
function finish(event){if(!scrubbing)return;if(event.type==='pointerup')seek(pointerTime(event));scrubbing=false;if(slider.hasPointerCapture(event.pointerId))slider.releasePointerCapture(event.pointerId);play()}
slider.addEventListener('pointerup',finish);slider.addEventListener('pointercancel',finish);
slider.addEventListener('input',()=>{seek(Number(slider.value));if(!scrubbing)play()});
video.addEventListener('loadedmetadata',()=>{if(pendingTime!==null){video.currentTime=Math.min(pendingTime,duration()-.001);pendingTime=null}sync()});video.addEventListener('timeupdate',sync);video.addEventListener('seeked',sync);
video.addEventListener('play',()=>{if(scrubbing){video.pause();return}start.hidden=true;cancelAnimationFrame(frame);tick()});video.addEventListener('pause',()=>cancelAnimationFrame(frame));start.addEventListener('click',play);
video.addEventListener('error',()=>{start.hidden=false;start.setAttribute('aria-label','Retry scene video');loaded=false});
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView&&!document.hidden&&!scrubbing)play();else video.pause()},{threshold:.25}).observe(video);else{inView=true;play()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(inView&&!scrubbing)play()});
})();
