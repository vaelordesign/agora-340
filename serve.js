// Petit serveur local pour tester agora-340.html (node serve.js, puis http://localhost:8765/agora-340.html)
const http=require('http'),fs=require('fs'),p=require('path');
const root=__dirname, port=process.env.PORT||8765;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'};
http.createServer((req,res)=>{ let f=p.join(root,decodeURIComponent(req.url.split('?')[0].split('#')[0])); if(f.endsWith(p.sep)||req.url==='/') f=p.join(root,'agora-340.html');
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end('404');return;} res.writeHead(200,{'Content-Type':types[p.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(port,()=>console.log('http://localhost:'+port+'/'));
