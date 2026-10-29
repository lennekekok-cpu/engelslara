// Build only public application files. No local progress or development files are published.
import './bundle.mjs';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const root=new URL('.',import.meta.url),out=new URL('docs/',root);
await mkdir(out,{recursive:true});
await copyFile(new URL('lara.html',root),new URL('index.html',out));
await copyFile(new URL('poek-icon.png',root),new URL('poek-icon.png',out));
await writeFile(new URL('.nojekyll',out),'');
console.log('Public site built in docs/ (GitHub Pages: main /docs).');
