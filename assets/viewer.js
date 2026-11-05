const code=document.body.dataset.station;
const status=document.getElementById('status');
const graph=document.getElementById('series');
const toolbar=document.querySelector('.toolbar');
const units={DO:'mg/L',pCO2:'ppm',Lvl:'kPa',Cond_LR:'µS/cm',Cond_FR:'µS/cm',Temp_DO:'°C',Temp_Lvl:'°C',Temp_cond:'°C'};
const labels={DO:'Oxígeno disuelto',pCO2:'pCO₂',Lvl:'Nivel / presión del sensor',Cond_LR:'Conductividad LR',Cond_FR:'Conductividad FR',Temp_DO:'Temperatura del sensor de oxígeno',Temp_Lvl:'Temperatura del sensor de nivel',Temp_cond:'Temperatura del sensor de conductividad',Temp:'Temperatura (columna original Temp)'};
const colors=['#2563eb','#e76f24','#168267','#9333ea','#c03158','#477a9e','#a47716','#3d7953','#6b7280'];
let bounds;
let sizeObserver;
let resizeFrame;
function parse(text){return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./csv-worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{worker.terminate();data.ok?resolve(data.data):reject(new Error(data.error));};
  worker.onerror=()=>{worker.terminate();reject(new Error('No fue posible procesar el CSV.'));};
  worker.postMessage(text);
});}
function range(start,end){
  const change={};
  for(const key of Object.keys(graph.layout))if(/^xaxis\d*$/.test(key)){
    change[key+'.autorange']=!start;if(start)change[key+'.range']=[start,end];
  }
  if(!start)for(const key of Object.keys(graph.layout))if(/^yaxis\d*$/.test(key))change[key+'.autorange']=true;
  Plotly.relayout(graph,change);
}
async function load(){
  status.textContent='Cargando los datos de la estación…';status.classList.remove('error');
  document.getElementById('retry').hidden=true;toolbar.hidden=true;
  try{
    if(typeof Plotly==='undefined')throw new Error('No fue posible cargar Plotly. Vuelve a cargar la página.');
    const response=await fetch(new URL(`../merged/${code}_merged.csv`,import.meta.url),{cache:'no-store'});
    if(!response.ok)throw new Error(`No fue posible leer el CSV (HTTP ${response.status}).`);
    const {dates,columns}=await parse(await response.text());
    if(!columns.length)throw new Error('No hay variables con observaciones.');
    bounds=[dates[0].slice(0,10),dates.at(-1).slice(0,10)];
    const n=columns.length, gap=.035, panel=(1-gap*(n-1))/n;
    const plotHeight=Math.max(600,245*n);
    sizeObserver?.disconnect();
    cancelAnimationFrame(resizeFrame);
    graph.style.height=plotHeight+'px';
    let plotWidth=Math.max(1,Math.floor(graph.clientWidth));
    const layout={autosize:false,width:plotWidth,height:plotHeight,margin:{l:120,r:35,t:65,b:65,autoexpand:false},showlegend:false,hovermode:'x unified',dragmode:'zoom',font:{family:'Arial, sans-serif',size:13},annotations:[],paper_bgcolor:'white',plot_bgcolor:'white'};
    const timeFormats=[
      {dtickrange:[null,1000],value:'%H:%M:%S.%L<br>%d %b %Y'},
      {dtickrange:[1000,60000],value:'%H:%M:%S<br>%d %b %Y'},
      {dtickrange:[60000,86400000],value:'%H:%M<br>%d %b %Y'},
      {dtickrange:[86400000,'M1'],value:'%d %b<br>%Y'},
      {dtickrange:['M1',null],value:'%b<br>%Y'}
    ];
    const traces=columns.map((c,i)=>{
      const axis=i?String(i+1):'';const ytop=1-i*(panel+gap);
      layout['yaxis'+axis]={anchor:'x'+axis,domain:[ytop-panel,ytop],title:{text:units[c.name]||c.name},automargin:false,nticks:5,tickformat:'.12~g',gridcolor:'#e5ecf2',zerolinecolor:'#cbd5e1'};
      layout['xaxis'+axis]={anchor:'y'+axis,type:'date',matches:i?'x':undefined,automargin:false,nticks:5,showticklabels:i===n-1,showspikes:true,spikemode:'across',tickformatstops:timeFormats,gridcolor:'#e5ecf2',title:i===n-1?{text:'Fecha y hora registradas'}:undefined};
      layout.annotations.push({xref:'paper',yref:'paper',x:.5,y:ytop,xanchor:'center',yanchor:'bottom',showarrow:false,text:`${labels[c.name]||c.name} · ${c.name}${units[c.name]?' ('+units[c.name]+')':''}`,font:{size:14}});
      return {type:'scatter',mode:'lines',x:dates,y:c.values,xaxis:'x'+axis,yaxis:'y'+axis,name:c.name,connectgaps:false,line:{color:colors[i%colors.length],width:1.3},hovertemplate:`%{x|%Y-%m-%d %H:%M}<br>${c.name}: %{y:.6g} ${units[c.name]||''}<extra></extra>`};
    });
    await Plotly.newPlot(graph,traces,layout,{responsive:false,displaylogo:false,scrollZoom:true,toImageButtonOptions:{format:'png',filename:code+'_series',scale:2}});
    // Resize only the width. Plotly's autosize must not collapse subplot heights during zoom.
    sizeObserver=new ResizeObserver(()=>{
      const width=Math.max(1,Math.floor(graph.clientWidth));
      if(width===plotWidth)return;
      plotWidth=width;
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(()=>Plotly.relayout(graph,{width,height:plotHeight,autosize:false}));
    });
    sizeObserver.observe(graph);
    status.textContent=`${bounds[0]} a ${bounds[1]} · ${n} variables · ${dates.length.toLocaleString('es')} fechas en la serie.`;
    for(const id of ['start','end']){const field=document.getElementById(id);field.min=bounds[0];field.max=bounds[1];field.value=id==='start'?bounds[0]:bounds[1];}
    toolbar.hidden=false;
  }catch(error){status.textContent=error.message;status.classList.add('error');document.getElementById('retry').hidden=false;}
}
document.getElementById('apply').onclick=()=>{
  const a=document.getElementById('start').value,b=document.getElementById('end').value;
  if(a&&b&&a<=b)range(a+'T00:00:00',b+'T23:59:59');
  else alert('Selecciona un período válido: la fecha inicial debe ser anterior a la final.');
};
document.getElementById('reset').onclick=()=>range(null,null);
document.getElementById('retry').onclick=load;
document.querySelectorAll('[data-days]').forEach(button=>button.onclick=()=>{
  const end=new Date(bounds[1]+'T23:59:59Z'),start=new Date(end.getTime()-Number(button.dataset.days)*86400000);
  range(start.toISOString().slice(0,19),end.toISOString().slice(0,19));
});
load();
