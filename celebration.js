let applauseContext=null;
export function stopParty(){document.querySelector('.confetti-burst')?.remove();if(applauseContext){applauseContext.close().catch(()=>{});applauseContext=null;}}
export function party({sound=true,confetti=true}={},big=false){
 stopParty();
 if(confetti&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){const layer=document.createElement('div');layer.className='confetti-burst';layer.setAttribute('aria-hidden','true');for(let i=0;i<(big?65:30);i++){const dot=document.createElement('i');dot.style.setProperty('--x',`${(Math.random()-.5)*85}vw`);dot.style.setProperty('--r',`${Math.random()*900}deg`);dot.style.setProperty('--c',['#b292ee','#58d4cc','#f8c67b','#ef9dbb'][i%4]);dot.style.left=`${35+Math.random()*30}%`;dot.style.animationDelay=`${Math.random()*.12}s`;layer.append(dot);}document.body.append(layer);setTimeout(()=>layer.remove(),1400);}
 if(!sound)return;
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
 try{const ctx=applauseContext=new Audio();ctx.resume().catch(()=>{});const master=ctx.createGain();master.gain.value=.17;master.connect(ctx.destination);
 // Layered short noise transients create a quiet crowd-clapping sound, not a success beep.
 for(let i=0;i<(big?24:15);i++){const source=ctx.createBufferSource(),buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.13),ctx.sampleRate),data=buffer.getChannelData(0);for(let j=0;j<data.length;j++)data[j]=(Math.random()*2-1)*Math.exp(-j/(ctx.sampleRate*.022));source.buffer=buffer;const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=900+Math.random()*1700;filter.Q.value=.6;source.connect(filter);filter.connect(master);source.start(ctx.currentTime+i*.035+Math.random()*.025);}
 setTimeout(()=>{if(applauseContext===ctx){ctx.close().catch(()=>{});applauseContext=null;}},big?1200:800);
 }catch{/* Sound availability never blocks learning. */}
}
