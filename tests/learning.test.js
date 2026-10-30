import {childlikeVoice,comparison} from '../experience.js';
import {initExtras,logPass,logCheck,practiceDays,wordStatus,awardBlock,dayKey} from '../progress.js';
import {createGame,choicesFor,completeWord,beginReview,nextBlock} from '../game.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial} from '../data.js';
import {assess,record,status,mastered,parsePairs,validateWords,queue} from '../learning.js';
const word={id:'x',en:'friendly',nl:'vriendelijk',alts:['aardig'],enAlts:[]};
test('spelling, synonyms and whitespace are treated separately',()=>{
 assert.equal(assess(word,'en-nl','  AARDIG '),'correct');
 assert.equal(assess(word,'nl-en','freindly'),'wrong');
 assert.equal(assess(word,'nl-en','frendly'),'typo');
 assert.equal(assess(word,'en-nl','vriendeljk'),'typo');
 assert.equal(assess(word,'nl-en','cat'),'wrong');
});
test('random answers, hints, repeats and speech never manufacture mastery',()=>{
 const s=initial(),now=Date.UTC(2026,1,1);
 for(let i=0;i<20;i++){record(s,'x','nl-en','wrong',false,'a',now);record(s,'x','en-nl','correct',true,'a',now);}
 assert.equal(mastered(s,'x'),false);assert.equal(s.progress['x:en-nl'].days.length,0);
 for(let i=0;i<10;i++)record(s,'x','spelling','correct',false,'a',now);
 assert.equal(s.progress['x:spelling'].days.length,1);
 record(s,'x','spelling','correct',false,'another',now);assert.equal(s.progress['x:spelling'].days.length,1);
 for(let day=1;day<=2;day++)record(s,'x','spelling','correct',false,'a',now+day*86400000);
 assert.equal(s.progress['x:spelling'].days.length,1);
 for(let day=1;day<=2;day++)record(s,'x','spelling','correct',false,'b'+day,now+day*86400000);
 assert.equal(status(s.progress['x:spelling']),'Onthouden!');
 record(s,'x','speech','practice',true,'c',now);assert.equal(s.progress['x:speech'].days.length,0);
});
test('English typo is recognized but does not prove spelling; Dutch typo tolerates meaning',()=>{
 const s=initial();record(s,'x','nl-en','typo',false,'a');record(s,'x','spelling','typo',false,'a');
 assert.equal(s.progress['x:nl-en'].recognized,1);assert.equal(s.progress['x:spelling'].days.length,0);
 record(s,'x','en-nl','typo',false,'a');assert.equal(s.progress['x:en-nl'].days.length,1);
});
test('CSV handles quotes, synonyms, missing fields and duplicates',()=>{
 const w=parsePairs('Engels,Nederlands,alternatieven\n"sad","verdrietig, bedroefd","treurig|sip"\ncat,kat,poes');
 assert.equal(w.length,2);assert.equal(w[0].nl,'verdrietig, bedroefd');assert.deepEqual(w[0].alts,['treurig','sip']);
 assert.equal(validateWords(parsePairs('cat,kat\ncat,\n,dog')).length,3);
});
test('new lists and JSON persistence preserve prior results and queue uses active lists',()=>{
 const s=initial();record(s,'school-0','en-nl','correct',false,'a');const before=JSON.stringify(s.progress);
 s.lists.push({id:'new',name:'New',active:true,words:[word]});assert.equal(JSON.stringify(s.progress),before);
 const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(restored.progress,s.progress);
 s.lists[0].active=false;assert.ok(queue(s).every(t=>t.word.id==='x'));
});

test('listening recognizes meaning, keeps historical skills separate and never schedules recording',()=>{
 const s=initial();assert.ok(queue(s).every(t=>t.skill==='listen'));
 assert.equal(assess(word,'listen',' Aardig '),'correct');
 record(s,'x','en-nl','correct',false,'old');assert.equal(mastered(s,'x'),false);
 const now=Date.UTC(2026,1,1);
 record(s,'x','listen','correct',true,'intro',now);assert.equal(s.progress['x:listen'].days.length,0);
 for(let i=0;i<20;i++)record(s,'x','listen','wrong',false,'guess',now);
 assert.equal(mastered(s,'x'),false);
 for(let i=0;i<3;i++)record(s,'x','listen','correct',false,'day'+i,now+i*86400000);
 assert.equal(mastered(s,'x'),true);
 assert.equal(s.progress['x:en-nl'].days.length,1);
});


test('game includes ALL lists and ALL 34 words, in ten-word blocks with last block of four',()=>{
 const s=initial();const words=s.lists.flatMap(l=>l.words),g=createGame(words,()=>.9999);const seen=[];
 while(g.phase!=='end'){
  assert.ok(g.words.length<=10);assert.ok(g.words.length>0);
  while(g.phase==='learn'){seen.push(g.words[g.index].id);completeWord(g);}
  if(g.phase==='block-end')nextBlock(g);
 }
 assert.equal(g.completed,34);assert.equal(new Set(seen).size,34);assert.equal(seen.length,34);assert.equal(g.words.length,4);
});
test('mistaken words repeat after ten and keep repeating until BOTH skills are clean',()=>{
 const words=initial().lists[0].words,g=createGame(words,()=>.9999);
 for(let i=0;i<10;i++){assert.equal(g.repeat,false);g.wordFailed=i===1||i===4;completeWord(g);}
 assert.equal(g.phase,'review-ready');assert.equal(g.completed,10);
 assert.deepEqual(g.mistakes.map(w=>w.id),[words[1].id,words[4].id]);
 beginReview(g);assert.equal(g.phase,'learn');assert.equal(g.words.length,2);assert.equal(g.repeat,true);
 g.wordFailed=true;completeWord(g);assert.equal(g.phase,'learn');completeWord(g);
 assert.equal(g.phase,'review-ready');assert.equal(g.blockClean,false);assert.equal(g.reviewed,2);assert.equal(g.completed,10);
 assert.deepEqual(g.mistakes.map(w=>w.id),[words[1].id]);beginReview(g);completeWord(g);assert.equal(g.phase,'block-end');assert.equal(g.blockClean,true);
 nextBlock(g);assert.equal(g.phase,'learn');assert.equal(g.words[0].id,words[10].id);assert.equal(g.mistakes.length,0);
});
test('four distinct choices contain only one valid translation, including synonym overlaps',()=>{
 const words=initial().lists[0].words;
 for(const word of words){const options=choicesFor(word,words,()=>.5);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(v=>[word.nl,...word.alts].includes(v)).length,1);assert.ok(options.includes(word.nl));}
});


test('gifts require 100% in both skills including every retry; duplicate claims, failed/stopped blocks cannot farm gifts',()=>{
 const s=initExtras(initial()),words=s.lists[0].words,g=createGame(words,()=>.9999),now=Date.UTC(2026,9,29,10);
 assert.equal(awardBlock(s,g,now),null);
 for(let i=0;i<10;i++){g.wordFailed=i===0;completeWord(g);}
 assert.equal(awardBlock(s,g,now),null);beginReview(g);g.wordFailed=true;completeWord(g);
 assert.equal(g.phase,'review-ready');assert.equal(awardBlock(s,g,now),null);
 beginReview(g);completeWord(g);assert.equal(g.blockClean,true);
 assert.equal(awardBlock(s,g,now).name,'Poeks koptelefoon');assert.equal(awardBlock(s,g,now),null);
 assert.equal(awardBlock(s,g,now+86400000).name,'Paarse gitaar');
});
test('new block and final short block each get a gift, daily collection has a finite cap',()=>{
 const s=initExtras(initial()),words=s.lists[0].words,g=createGame(words,()=>.9999),now=Date.UTC(2026,9,29,10);
 while(g.phase!=='end'){while(g.phase==='learn')completeWord(g);assert.ok(awardBlock(s,g,now));if(g.phase==='block-end')nextBlock(g);}
 assert.equal(s.studio.awards.length,4);assert.equal(s.studio.awards[3].wordIds.length,4);
 const other=createGame(words,()=>.3);for(let i=0;i<10;i++)completeWord(other);
 assert.equal(awardBlock(s,other,now),null);
});
test('clean practice tracks repeats separately from days; failures and historical counters never inflate retention',()=>{
 const s=initExtras(initial()),now=Date.UTC(2026,9,29,10);
 s.progress['school-0:guided-english']={attempts:100};assert.equal(s.practice['school-0'],undefined);
 logPass(s,'x',false,now);for(let i=0;i<4;i++)logPass(s,'x',true,now+i*1000);
 assert.equal(s.practice.x.goodPasses,4);assert.equal(s.practice.x.cleanDays.length,1);assert.equal(s.practice.x.recallDays.length,0);
 logPass(s,'x',true,now+86400000);assert.equal(s.practice.x.cleanDays.length,2);
 assert.notEqual(wordStatus(s.practice.x),'Zelf onthouden');
});
test('only delayed correct unaided checks on three different days prove retention; hints and immediate retries do not',()=>{
 const s=initExtras(initial()),now=Date.UTC(2026,9,29,10);
 logPass(s,'x',true,now);assert.equal(logCheck(s,'x',true,false,now+1000).counted,false);
 logCheck(s,'x',true,true,now+2000);assert.equal(s.practice.x.recallDays.length,0);
 for(let day=1;day<=3;day++)logCheck(s,'x',true,false,now+day*86400000+3000);
 assert.equal(s.practice.x.recallDays.length,3);assert.equal(wordStatus(s.practice.x),'Zelf onthouden');
 logCheck(s,'x',false,false,now+4*86400000);assert.equal(wordStatus(s.practice.x),'Nog oefenen');
 assert.equal(logCheck(s,'x',true,false,now+4*86400000+1000).counted,false);assert.equal(wordStatus(s.practice.x),'Nog oefenen');
});
test('day boundaries use Amsterdam time and legacy data survives initialization',()=>{
 const s=initial();s.rewards=['2026-10-28'];const before=JSON.stringify(s.progress);initExtras(s);
 assert.equal(s.examDate,'2026-11-06');assert.deepEqual(s.rewards,['2026-10-28']);assert.equal(JSON.stringify(s.progress),before);
 assert.equal(dayKey(Date.UTC(2026,10,1,23,30)),'2026-11-02');assert.equal(practiceDays({cleanDays:['a','b'],recallDays:['b','c']}),3);
});


test('sentence placeholders and punctuation never fail a correct phrase, real missing words still do',()=>{
 const w={en:'What does ... look like?',nl:'Hoe ziet ... eruit?',alts:[],enAlts:[]};
 for(const answer of ['What does .. look like?','What does … look like','what does look like',' What does . look like?  '])assert.equal(assess(w,'nl-en',answer),'correct');
 assert.notEqual(assess(w,'nl-en','what look like'),'correct');
 assert.equal(assess({en:'What colour ...?',nl:'Welke kleur?',alts:[]},'nl-en','What colour?'),'correct');
 assert.equal(assess({en:'sad',nl:'verdrietig',alts:[]},'nl-en',' SAD?  '),'correct');
});
test('light English voice preferences and an explicit parent choice override low defaults',()=>{
 const voices=[{name:'Daniel',lang:'en-GB',voiceURI:'d'},{name:'Samantha',lang:'en-US',voiceURI:'s'},{name:'Flo',lang:'en-GB',voiceURI:'f'},{name:'Dutch',lang:'nl-NL',voiceURI:'n'}];
 assert.equal(childlikeVoice(voices).name,'Flo');assert.equal(childlikeVoice(voices,'s').name,'Samantha');assert.equal(childlikeVoice([]),null);
});
test('comparison preserves the typed answer, highlights missing letters and escapes HTML',()=>{
 const c=comparison('frendly','friendly');assert.ok(c.expected.includes('<mark>i</mark>'));assert.equal(c.typed,'frendly');
 assert.ok(!comparison('<script>','cat').typed.includes('<script>'));
 assert.ok(!comparison('What does .. lok like?','What does ... look like?').expected.includes('<mark>.</mark>'));
 assert.deepEqual(comparison('What colour..','What colour ...?',true),{typed:'What colour..',expected:'What colour ...?'});
});
test('all words remain included but difficult sentence templates come last',()=>{
 const words=initial().lists[0].words,g=createGame(words,()=>.3);assert.equal(g.deck.length,34);
 assert.ok(g.deck.slice(-3).every(w=>w.en.includes('...')));assert.ok(g.deck.slice(0,10).every(w=>!w.en.includes('...')));
});
