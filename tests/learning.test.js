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
test('only mistaken words repeat, AFTER the first ten, through the same learning steps; repeat ends',()=>{
 const words=initial().lists[0].words,g=createGame(words,()=>.9999);
 for(let i=0;i<10;i++){assert.equal(g.repeat,false);g.wordFailed=i===1||i===4;completeWord(g);}
 assert.equal(g.phase,'review-ready');assert.equal(g.completed,10);
 assert.deepEqual(g.mistakes.map(w=>w.id),[words[1].id,words[4].id]);
 beginReview(g);assert.equal(g.phase,'learn');assert.equal(g.words.length,2);assert.equal(g.repeat,true);
 g.wordFailed=true;completeWord(g);assert.equal(g.phase,'learn');completeWord(g);
 assert.equal(g.phase,'block-end');assert.equal(g.reviewed,2);assert.equal(g.completed,10);
 nextBlock(g);assert.equal(g.phase,'learn');assert.equal(g.words[0].id,words[10].id);assert.equal(g.mistakes.length,0);
});
test('four distinct choices contain only one valid translation, including synonym overlaps',()=>{
 const words=initial().lists[0].words;
 for(const word of words){const options=choicesFor(word,words,()=>.5);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(v=>[word.nl,...word.alts].includes(v)).length,1);assert.ok(options.includes(word.nl));}
});
