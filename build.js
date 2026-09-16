// Assemble les morceaux de parts/ en une seule page autonome.
//  - agora-340.html : fragment (sans <html>/<head>/<body>) pour l'Artifact et l'ouverture locale
//  - docs/index.html : page complète pour GitHub Pages (noindex : page privée, pas pour Google)
const fs=require('fs'),p=require('path');
const P=x=>fs.readFileSync(p.join(__dirname,'parts',x),'utf8');
const head=P('a-head.html');
const body=[P('f-express.html'),P('b-fiches.html'),P('c-views.html'),'<script>',P('d-bank.js'),P('e-app.js'),'</script>',''].join('\n');
fs.writeFileSync(p.join(__dirname,'agora-340.html'),head+'\n'+body);
fs.mkdirSync(p.join(__dirname,'docs'),{recursive:true});
const extra='<meta name="robots" content="noindex">\n<meta name="theme-color" content="#24508E">\n';
fs.writeFileSync(p.join(__dirname,'docs','index.html'),'<!doctype html>\n<html lang="fr">\n<head>\n'+extra+head+'\n</head>\n<body>\n'+body+'</body>\n</html>\n');
console.log('agora-340.html :',((head.length+body.length)/1024).toFixed(0),'Ko ; docs/index.html écrit');
