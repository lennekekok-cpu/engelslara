export const skills=['listen'];
export const normalize=s=>s.toLowerCase().replace(/[‘’]/g,"'").replace(/[.…]+/g,' ').trim().replace(/[?!]+$/,'').trim().replace(/\s+/g,' ');
export function distance(a,b){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]!==b[j-1]));prev=old;}}return row[b.length];}
export function assess(word,skill,input){const answers=((skill==='en-nl'||skill==='listen')?[word.nl,...word.alts]:[word.en,...(word.enAlts||[])]).map(normalize);const value=normalize(input);if(answers.includes(value))return 'correct';if(value.length>=4&&answers.some(a=>distance(value,a)===1))return 'typo';return 'wrong';}
export function record(state,id,skill,result,help,session,now=Date.now()){
 const key=id+':'+skill;const p=state.progress[key]||{days:[],sessions:[],attempts:0,helped:0,wrong:0};p.attempts++;p.last=now;
 if(result==='typo')p.recognized=(p.recognized||0)+1;
 if(skill==='speech'){p.practiced=(p.practiced||0)+1;p.due=now+86400000;}
 else if((result==='correct'||((skill==='en-nl'||skill==='listen')&&result==='typo'))&&!help){const day=new Date(now).toISOString().slice(0,10);if(!p.days.includes(day)&&!p.sessions.includes(session)){p.days.push(day);p.sessions.push(session);}p.due=now+[1,3,7,14][Math.min(p.days.length-1,3)]*86400000;p.lastResult='independent';}
 else{if(help)p.helped++;else p.wrong++;p.lastResult=help?'helped':'practice';p.due=now+60000;}
 state.progress[key]=p;return p;
}
export function status(p){return !p?'Nieuw':p.days.length>=3?'Onthouden!':p.days.length>=2?'Lukt al':'Ik oefen';}
export function mastered(state,id){return (state.progress[id+':listen']?.days.length||0)>=3;}
export function queue(state,now=Date.now()){
 const words=state.lists.filter(l=>l.active).flatMap(l=>l.words);
 return words.map(word=>({word,skill:'listen',p:state.progress[word.id+':listen']}))
 .sort((a,b)=>{const rank=t=>!t.p?1:t.p.due<=now?0:2;return rank(a)-rank(b)||(a.p?.due||0)-(b.p?.due||0);}).slice(0,8);
}
export function parsePairs(text){const rows=[];let field='',row=[],quoted=false;const delimiter=text.includes('\t')?'\t':text.includes(';')?';':',';for(let i=0;i<=text.length;i++){const c=text[i]??'\n';if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===delimiter||c==='\n')){row.push(field.trim());field='';if(c==='\n'){if(row.some(Boolean))rows.push(row);row=[];}}else if(c!=='\r')field+=c;}if(quoted)throw Error('Een aanhalingsteken is niet afgesloten.');if(rows[0]&&/^(engels|english|en)$/i.test(rows[0][0]))rows.shift();return rows.map(r=>({en:r[0]||'',nl:r[1]||'',alts:(r[2]||'').split('|').map(s=>s.trim()).filter(Boolean),enAlts:(r[3]||'').split('|').map(s=>s.trim()).filter(Boolean)}));}
export function validateWords(words){const seen=new Set();return words.flatMap((w,i)=>{const errors=[];if(!w.en||!w.nl)errors.push(`Regel ${i+1}: Engels of Nederlands ontbreekt.`);if(seen.has(normalize(w.en)))errors.push(`Regel ${i+1}: dubbel Engels woord (${w.en}).`);seen.add(normalize(w.en));return errors;});}
