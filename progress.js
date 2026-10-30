export const TEST_DATE='2026-11-06';
export const dayKey=(now=Date.now())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
export const gifts=[['🎧','Poeks koptelefoon'],['🎸','Paarse gitaar'],['🔊','Studiospeakers'],['🥁','Drumstel'],['🎹','Keyboard'],['🪩','Discobal'],['💿','Platenverzameling'],['💡','Podiumlamp'],['🎼','Muziekstandaard'],['⭐','Sterrenposter'],['🎷','Saxofoon'],['🛋️','Chillbank']];
export function initExtras(state){state.effects??={sound:true,confetti:true};state.voice??={uri:'',pitch:1.3};state.studio??={awards:[]};state.studio.opened??=[];state.studio.equipped??='base';state.practice??={};state.studio??={awards:[]};state.examDate??=state.lists.find(l=>l.id==='school-unit1')?.date||TEST_DATE;return state;}
export function logPass(state,id,clean,now=Date.now()){
 initExtras(state);const p=state.practice[id]??={passes:0,goodPasses:0,cleanDays:[],recallDays:[]};
 p.passes++;p.lastPassClean=clean;p.lastExample=now;if(!clean&&p.recallDays.length)p.needsRecall=true;
 if(clean){p.goodPasses++;const day=dayKey(now);if(!p.cleanDays.includes(day))p.cleanDays.push(day);}
 p.due=now+86400000;state.practice[id]=p;return p;
}
export function logCheck(state,id,correct,help=false,now=Date.now()){
 initExtras(state);const p=state.practice[id]??={passes:0,goodPasses:0,cleanDays:[],recallDays:[]};
 p.checks=(p.checks||0)+1;p.lastCheck=correct&&!help;p.lastCheckAt=now;
 // Delayed recall, not copying a just-seen example, counts towards retention.
 const delayed=(!p.lastExample||now-p.lastExample>=20*3600000)&&(!p.lastRecall||now-p.lastRecall>=20*3600000);
 if(correct&&!help&&delayed){p.needsRecall=false;const day=dayKey(now);if(!p.recallDays.includes(day)){p.recallDays.push(day);p.lastRecall=now;}}
 else if(!correct||help){p.lastExample=now;p.needsRecall=true;}
 p.due=now+(correct&&!help?Math.min(3,p.recallDays.length||1)*86400000:3600000);state.practice[id]=p;
 return {p,counted:correct&&!help&&delayed};
}
export function practiceDays(p){return p?new Set([...p.cleanDays,...p.recallDays]).size:0;}
export function wordStatus(p){if(!p)return 'Nog beginnen';if((p.needsRecall||p.lastCheck===false)||(p.lastPassClean===false&&(p.lastExample||0)>(p.lastCheckAt||0)))return 'Nog oefenen';if(p.recallDays.length>=3)return 'Zelf onthouden';if(p.recallDays.length)return `Zelf gecheckt op ${p.recallDays.length}/3 dagen`;return `Goed geoefend op ${p.cleanDays.length}/3 dagen`;}
export function dueWords(state,words,now=Date.now()){return [...words].sort((a,b)=>{const rank=w=>{const p=state.practice?.[w.id];return !p?0:wordStatus(p)==='Nog oefenen'?1:p.due<=now?2:3;};return rank(a)-rank(b)||(state.practice?.[a.id]?.due||0)-(state.practice?.[b.id]?.due||0);});}
export function awardBlock(state,game,now=Date.now()){
 initExtras(state);if(!game.blockClean)return null;
 const ids=game.deck.slice(game.offset,game.offset+10).map(w=>w.id).sort();const day=dayKey(now),key=JSON.stringify([day,ids]);
 if(state.studio.awards.some(a=>a.key===key))return null;
 // A finite daily collection: replaying or reshuffling cannot farm endless gifts.
 if(state.studio.awards.filter(a=>a.day===day).length>=Math.ceil(game.deck.length/10))return null;
 const n=state.studio.awards.length,[icon,name]=gifts[n]||['⭐',`Muziekster ${n-gifts.length+1}`];
 const gift={key,day,icon,name,wordIds:ids,at:now};state.studio.awards.push(gift);return gift;
}
