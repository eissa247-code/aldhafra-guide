// Usage: node make_pdf.js  (needs playwright). Renders each course HTML to a PDF next to it.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
for(const f of ['chatgpt-course','copilot365-course','gemini-course']){
 const p=await b.newPage();const dir=path.resolve(__dirname,'..');
 await p.goto('file://'+dir+'/'+f+'.html');
 await p.evaluate(()=>{document.documentElement.setAttribute('data-print','1');document.querySelectorAll('details').forEach(d=>d.open=true)});
 await p.emulateMedia({media:'print',colorScheme:'light'});await p.evaluate(()=>document.fonts.ready);
 await p.pdf({path:dir+'/'+f+'.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',
 footerTemplate:'<div style="font-size:9px;width:100%;text-align:center;color:#666"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',margin:{top:'16mm',bottom:'16mm',left:'14mm',right:'14mm'}});
 await p.close();}
await b.close()})()
