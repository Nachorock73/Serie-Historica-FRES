export function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows=[]; let row=[], value='', quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') {
      if(quoted && text[i+1]==='"'){value+='"';i++;} else quoted=!quoted;
    } else if(c===',' && !quoted){row.push(value);value='';}
    else if((c==='\n'||c==='\r')&&!quoted) {
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(value); if(row.some(v=>v.trim()!==''))rows.push(row);row=[];value='';
    } else value+=c;
  }
  if(quoted)throw new Error('El CSV contiene comillas sin cerrar.');
  if(value!==''||row.length){row.push(value);rows.push(row);}
  if(rows.length<2)throw new Error('El CSV no contiene observaciones.');
  const headers=rows.shift().map(v=>v.trim());
  if(headers[0]!=='Date'||new Set(headers).size!==headers.length)throw new Error('Cabecera CSV no reconocida.');
  const dates=[], values=headers.slice(1).map(()=>[]);
  let previous='';
  for(const [i,r] of rows.entries()) {
    if(r.length!==headers.length)throw new Error(`Fila ${i+2}: número incorrecto de columnas.`);
    const stamp=r[0].trim().replace(' ','T').replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(stamp))throw new Error(`Fila ${i+2}: fecha inválida.`);
    const calendar=new Date(stamp+'Z');
    if(!Number.isFinite(calendar.getTime())||calendar.toISOString().slice(0,19)!==stamp.slice(0,19))throw new Error(`Fila ${i+2}: fecha inexistente.`);
    if(previous && stamp<=previous)throw new Error('Las fechas deben ser únicas y estar ordenadas.');
    previous=stamp; dates.push(stamp);
    for(let c=1;c<headers.length;c++) {
      const raw=r[c].trim();
      const n=/^(?:|NA|NaN|null)$/i.test(raw)?null:Number(raw);
      if(n!==null&&!Number.isFinite(n))throw new Error(`Fila ${i+2}: ${headers[c]} no es numérico.`);
      values[c-1].push(n);
    }
  }
  return {dates,columns:headers.slice(1).map((name,i)=>({name,values:values[i]})).filter(c=>c.values.some(v=>v!==null))};
}
if(typeof self!=='undefined'&&typeof self.postMessage==='function') {
  self.onmessage=({data})=>{try{self.postMessage({ok:true,data:parseCsv(data)});}catch(error){self.postMessage({ok:false,error:error.message});}};
}
