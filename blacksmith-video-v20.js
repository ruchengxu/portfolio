(()=>{
const video=document.querySelector('#scene-video'),slider=document.querySelector('#scene-time'),start=document.querySelector('.scene-start');let loaded=false,pendingTime=null,inView=false,frame=0;
function load(){if(!loaded){loaded=true;video.src=video.dataset.src;video.load()}}
function sync(){const duration=Number.isFinite(video.duration)?video.duration:30;slider.max=duration;slider.value=video.currentTime;slider.style.setProperty("--progress",`${video.currentTime/duration*100}%`);const t=video.currentTime;slider.setAttribute('aria-valuetext',`${t<10?'Morning':t<18.3?'Day':t<21.7?'Afternoon / Sunset':'Night'}, ${t.toFixed(1)} seconds`)}
function tick(){sync();if(!video.paused)frame=requestAnimationFrame(tick)}
async function play(){load();try{await video.play();start.hidden=true}catch{start.hidden=false}}
slider.addEventListener('input',()=>{const t=Number(slider.value);load();if(video.readyState>=1)video.currentTime=Math.min(t,video.duration);else pendingTime=t;play()});
video.addEventListener('loadedmetadata',()=>{if(pendingTime!==null){video.currentTime=Math.min(pendingTime,video.duration);pendingTime=null}sync()});video.addEventListener('timeupdate',sync);video.addEventListener('play',()=>{start.hidden=true;cancelAnimationFrame(frame);tick()});video.addEventListener('pause',()=>cancelAnimationFrame(frame));start.addEventListener('click',play);
video.addEventListener('error',()=>{start.hidden=false;start.setAttribute('aria-label','Retry scene video');loaded=false});
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView&&!document.hidden)play();else video.pause()},{threshold:.25}).observe(video);else{inView=true;play()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(inView)play()});
})();