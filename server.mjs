import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
http.createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.includes('..'))throw Error(); const file=path==='/'?'index.html':path.slice(1);if(!/^[\w./-]+$/.test(file)||file.startsWith('.'))throw Error();const data=await readFile(root+file);res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css; charset=utf-8'})[file.split('.').pop()]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Niet gevonden');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Poek’s woordenclub draait op poort '+(process.env.PORT||3000)));
