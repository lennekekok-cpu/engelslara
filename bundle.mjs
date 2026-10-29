import {readFile,writeFile} from 'node:fs/promises';
let html=await readFile(new URL('index.html',import.meta.url),'utf8');
const css=await readFile(new URL('style.css',import.meta.url),'utf8');
const scripts=await Promise.all(['data.js','learning.js','game.js','progress.js','app.js'].map(async name=>(await readFile(new URL(name,import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/\bexport /g,'')));
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>').replace('<script type="module" src="app.js"></script>','<script type="module">'+scripts.join('\n')+'</script>');
await writeFile(new URL('lara.html',import.meta.url),html);
