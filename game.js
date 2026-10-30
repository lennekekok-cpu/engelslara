import {normalize} from './learning.js';
export function shuffled(values,rng=Math.random){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function createGame(words,rng=Math.random){const deck=shuffled(words,rng).sort((a,b)=>Number(/\.{2,}|…/.test(a.en))-Number(/\.{2,}|…/.test(b.en)));return {deck,offset:0,words:deck.slice(0,10),index:0,phase:'learn',repeat:false,mistakes:[],completed:0,reviewed:0,wordFailed:false,choiceFailed:false,englishHelp:false,listened:false,attemptedAudio:false,correct:0,options:null,triedChoices:[],retryMistakes:[],blockClean:false};}
export function choicesFor(word,words,rng=Math.random){
 const accepted=new Set([word.nl,...word.alts].map(normalize));
 const distractors=[...new Map(words.filter(w=>![w.nl,...w.alts].some(x=>accepted.has(normalize(x)))).map(w=>[normalize(w.nl),w.nl])).values()];
 // For short parent-created lists, use real translations from the supplied school list as fallback.
 return shuffled([word.nl,...shuffled(distractors,rng).slice(0,3)],rng);
}
export function completeWord(game){
 const word=game.words[game.index];
 if(!game.repeat){game.completed++;if(game.wordFailed&&!game.mistakes.some(w=>w.id===word.id))game.mistakes.push(word);}
 else{game.reviewed++;if(game.wordFailed&&!game.retryMistakes.some(w=>w.id===word.id))game.retryMistakes.push(word);}
 game.index++;
 if(game.index<game.words.length){game.phase='learn';resetWord(game);return;}
 const pending=game.repeat?game.retryMistakes:game.mistakes;
 if(pending.length){game.mistakes=[...pending];game.phase='review-ready';}
 else{game.blockClean=true;game.phase=game.offset+10<game.deck.length?'block-end':'end';}
}
export function beginReview(game){game.words=[...game.mistakes];game.index=0;game.repeat=true;game.retryMistakes=[];game.phase='learn';resetWord(game);}
export function nextBlock(game){game.offset+=10;game.words=game.deck.slice(game.offset,game.offset+10);game.index=0;game.repeat=false;game.mistakes=[];game.retryMistakes=[];game.blockClean=false;game.gift=null;game.phase='learn';resetWord(game);}
export function resetWord(game){game.wordFailed=false;game.choiceFailed=false;game.englishHelp=false;game.listened=false;game.attemptedAudio=false;game.audioComplete=false;game.audioFailed=false;game.audioBypassed=false;game.options=null;game.triedChoices=[];}
