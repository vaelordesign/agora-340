// Assemble les morceaux de parts/ en une seule page autonome.
//  - agora-340.html : fragment (sans <html>/<head>/<body>) pour l'Artifact et l'ouverture locale
//  - docs/index.html : page complète pour GitHub Pages
const fs=require('fs'),p=require('path');
const P=x=>fs.readFileSync(p.join(__dirname,'parts',x),'utf8');
const head=P('a-head.html');
const body=P('b-fiches.html')+'\n'+P('c-views.html')+'\n<script>\n'+P('d-bank.js')+'\n'+P('e-app.js')+'\n</script>\n';
fs.writeFileSync(p.join(__dirname,'agora-340.html'),head+'\n'+body);
fs.mkdirSync(p.join(__dirname,'docs'),{recursive:true});
fs.writeFileSync(p.join(__dirname,'docs','index.html'),'<!doctype html>\n<html lang="fr">\n<head>\n'+head+'\n</head>\n<body>\n'+body+'</body>\n</html>\n');
console.log('agora-340.html :',((head.length+body.length)/1024).toFixed(0),'Ko ; docs/index.html écrit');
