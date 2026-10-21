const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

let cargos=[
 {name:'三人位沙发主体箱',sku:'SOFA-301-A',l:1980,w:820,h:610,qty:18,kg:65,rotate:true,stack:false,icon:'沙'},
 {name:'贵妃位沙发主体箱',sku:'SOFA-301-B',l:1640,w:920,h:620,qty:18,kg:58,rotate:true,stack:false,icon:'妃'},
 {name:'1.6m 岩板餐桌',sku:'TABLE-160-G',l:1680,w:920,h:180,qty:18,kg:52,rotate:true,stack:true,icon:'桌'},
 {name:'餐椅双装箱',sku:'CHAIR-LN-02',l:650,w:520,h:900,qty:54,kg:24,rotate:true,stack:true,icon:'椅'},
 {name:'圆形脚凳',sku:'STOOL-RD-01',l:660,w:660,h:450,qty:54,kg:12,rotate:true,stack:true,icon:'凳'},
 {name:'茶几面板箱',sku:'TABLE-COF-01',l:1260,w:720,h:190,qty:24,kg:31,rotate:true,stack:true,icon:'几'}
];

const colors=['#2878d7','#16a0b6','#7564cf','#2fa66d','#e58b2e','#d65a78','#5887a8','#8b6b42'];
const safe=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

function totals(){
  return {
    qty:cargos.reduce((s,c)=>s+(+c.qty||0),0),
    weight:cargos.reduce((s,c)=>s+(+c.qty||0)*(+c.kg||0),0)/1000,
    volume:cargos.reduce((s,c)=>s+(+c.l||0)*(+c.w||0)*(+c.h||0)*(+c.qty||0)/1e9,0)
  };
}

function renderRows(){
  $('#cargoRows').innerHTML=cargos.map((c,i)=>`<tr data-i="${i}"><td><div class="product-name"><i>${safe(c.icon||c.name?.[0]||'货')}</i><div><b>${safe(c.name)}</b><small>${safe(c.sku)}</small></div></div></td><td><input class="data-input dim" data-k="l" type="number" min="1" value="${c.l}"></td><td><input class="data-input dim" data-k="w" type="number" min="1" value="${c.w}"></td><td><input class="data-input dim" data-k="h" type="number" min="1" value="${c.h}"></td><td><input class="data-input dim" data-k="qty" type="number" min="1" value="${c.qty}"></td><td><input class="data-input dim" data-k="kg" type="number" min="0" step="0.1" value="${c.kg}"></td><td><span class="switch ${c.rotate?'on':''}" data-k="rotate"></span></td><td><span class="switch ${c.stack?'on':''}" data-k="stack"></span></td><td><button class="remove" title="移除">×</button></td></tr>`).join('');
  $$('.dim').forEach(el=>el.onchange=()=>{const i=+el.closest('tr').dataset.i;cargos[i][el.dataset.k]=+el.value;updateAll()});
  $$('.switch').forEach(el=>el.onclick=()=>{const i=+el.closest('tr').dataset.i,k=el.dataset.k;cargos[i][k]=!cargos[i][k];el.classList.toggle('on',cargos[i][k]);render3D()});
  $$('.remove').forEach(el=>el.onclick=()=>{cargos.splice(+el.closest('tr').dataset.i,1);renderRows();updateAll();showToast('已从本次订单移除该产品')});
}

function updateTotals(){
  const t=totals();
  $('#skuCount').textContent=cargos.length;
  $('#packageCount').textContent=t.qty;
  $('#totalVolume').textContent=t.volume.toFixed(1)+' m³';
  $('#totalWeight').textContent=t.weight.toFixed(1)+' t';
}

function render3D(restart=false){
  const scene=$('#cargoScene'),legend=$('#sceneLegend');
  if(!scene||!legend)return;
  if(restart)scene.innerHTML='';
  if(!cargos.length){scene.innerHTML='<div style="position:absolute;inset:0;display:grid;place-items:center;color:#708298;font-size:10px">暂无货物数据</div>';legend.innerHTML='';return;}
  const maxQty=Math.max(...cargos.map(c=>+c.qty||1));
  let blocks=[];
  cargos.forEach((c,i)=>{
    const count=clamp(Math.ceil((+c.qty||1)/maxQty*4),1,4);
    for(let n=0;n<count;n++)blocks.push({c,i,n});
  });
  blocks=blocks.slice(0,20);
  const bottoms=[2,2,2,2,2];
  scene.innerHTML=blocks.map((item,idx)=>{
    const {c,i,n}=item;
    const ratio=clamp((+c.h||500)/Math.max(+c.l||1,+c.w||1),.18,1.4);
    const h=clamp(17+ratio*12,18,34);
    let col=bottoms.indexOf(Math.min(...bottoms));
    if(bottoms[col]+h>88){col=idx%5;bottoms[col]=2+(Math.floor(idx/5)%3)*27;}
    const bottom=bottoms[col];bottoms[col]+=h+2;
    const left=2+col*18.4+(n%2)*.8;
    const width=clamp(13+(Math.min(+c.l||1000,+c.w||600)/Math.max(+c.l||1000,+c.w||600))*5,13,17.5);
    const label=safe((c.sku||`SKU${i+1}`).split('-').slice(0,2).join('-'));
    return `<div class="cargo-block" title="${safe(c.name)} · 第 ${n+1} 组" style="--left:${left}%;--bottom:${bottom}%;--w:${width}%;--h:${h}%;--z:${10+idx};--color:${colors[i%colors.length]};--delay:${idx*.035}s">${label}</div>`;
  }).join('');
  legend.innerHTML=cargos.slice(0,8).map((c,i)=>`<span title="${safe(c.name)}"><i style="--legend:${colors[i%colors.length]}"></i>${safe(c.sku||c.name)}</span>`).join('');
}

function updateDemoResult(){
  const t=totals(),types=[['20GP',33.2],['40GP',67.7],['40HQ',76.4],['45HQ',86]];
  let choice=types.find(x=>t.volume<=x[1]*.96),count=1;
  if(!choice){choice=types[3];count=Math.max(1,Math.ceil(t.volume/(choice[1]*.94)));}
  const util=t.volume?clamp(t.volume/(choice[1]*count)*100,1,98.5):0;
  const utilText=util.toFixed(1)+'%';
  $('#recommendedType').textContent=`${choice[0]} × ${count}`;
  $('#utilization').textContent=utilText;$('#meterValue').textContent=utilText;$('#meterBar').style.width=utilText;
  $('.meter small').textContent=`已装 ${t.volume.toFixed(1)} m³ / 柜内容积 ${(choice[1]*count).toFixed(1)} m³（演示估算）`;
  const stats=$$('.result-stats b');
  if(stats[0])stats[0].textContent=t.qty+' 件';
  if(stats[1])stats[1].textContent=clamp(t.weight/(26.5*count)*100,0,99).toFixed(1)+'%';
  if(stats[2])stats[2].textContent=Math.max(0,choice[1]*count-t.volume).toFixed(1)+' m³';
  return {type:choice[0],count,util,t};
}

function updateAll(){updateTotals();render3D();updateDemoResult()}

function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),2800)}
function showView(id){$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===id));$$('.view').forEach(x=>x.classList.toggle('active',x.id===id));window.scrollTo({top:0,behavior:'smooth'})}

renderRows();updateAll();
$$('.nav-item').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$('#noticeClose').onclick=()=>$('.notice').remove();
$('#saveBtn').onclick=()=>showToast('项目草稿已保存在当前浏览器（演示）');
$$('.segmented').forEach(group=>$$('button',group).forEach(b=>b.onclick=()=>{$$('button',group).forEach(x=>x.classList.remove('active'));b.classList.add('active')}));

$('#addProduct').onclick=()=>{cargos.push({name:'新产品包装箱',sku:'NEW-SKU-'+String(cargos.length+1).padStart(2,'0'),l:1000,w:600,h:500,qty:1,kg:20,rotate:true,stack:true,icon:'新'});renderRows();updateAll();showToast('已添加一行，请填写实际外包装尺寸')};
$('#importBtn').onclick=()=>{$('#fileInput').value='';$('#fileInput').click()};
$('#dismissImport').onclick=()=>$('#importSummary').hidden=true;

function parseCSV(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;}
    else if(ch==='"'){quoted=!quoted;}
    else if(ch===','&&!quoted){row.push(cell.trim());cell='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=ch;
  }
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);
  if(rows.length<2)return [];
  const headers=rows[0].map(x=>x.replace(/^\ufeff/,''));
  return rows.slice(1).map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??''])));
}

const norm=s=>String(s??'').trim().toLowerCase().replace(/[\s_()（）/\\-]/g,'');
const aliases={
 sku:['sku','产品编码','货号','产品sku'],name:['产品名称','品名','名称','productname','name'],
 l:['包装长mm','包装长','长mm','长度mm','长','lengthmm','length'],w:['包装宽mm','包装宽','宽mm','宽度mm','宽','widthmm','width'],h:['包装高mm','包装高','高mm','高度mm','高','heightmm','height'],
 qty:['数量','件数','箱数','qty','quantity'],kg:['单件毛重kg','单件重量kg','单件重量','毛重kg','重量kg','weightkg','weight'],
 rotate:['允许旋转','可旋转','旋转','allowrotate'],stack:['可堆叠','允许堆叠','堆叠','stackable']
};
function pick(row,list){const entries=Object.entries(row);for(const alias of list){const hit=entries.find(([k])=>norm(k)===norm(alias));if(hit)return hit[1]}return ''}
function toBool(value,defaultValue=true){if(value===''||value==null)return defaultValue;return !['否','不允许','不可','false','0','no','n'].includes(norm(value))}
function rowsToCargos(rows){
  let skipped=0;
  const parsed=rows.map((row,i)=>{
    const l=+pick(row,aliases.l),w=+pick(row,aliases.w),h=+pick(row,aliases.h),qty=+pick(row,aliases.qty);
    if(!(l>0&&w>0&&h>0&&qty>0)){skipped++;return null}
    const sku=String(pick(row,aliases.sku)||`SKU-${String(i+1).padStart(3,'0')}`).trim();
    const name=String(pick(row,aliases.name)||sku).trim();
    return {sku,name,l,w,h,qty,kg:+pick(row,aliases.kg)||0,rotate:toBool(pick(row,aliases.rotate),true),stack:toBool(pick(row,aliases.stack),true),icon:name[0]||'货'};
  }).filter(Boolean);
  return {parsed,skipped};
}

$('#fileInput').onchange=async()=>{
  const f=$('#fileInput').files[0];if(!f)return;
  $('#fileState').textContent='正在读取 '+f.name;
  try{
    let rows=[],sheetName='CSV';
    if(/\.csv$/i.test(f.name))rows=parseCSV(await f.text());
    else{
      if(!window.XLSX)throw new Error('Excel 解析组件未加载，请检查网络后重试，或先另存为 CSV');
      const workbook=XLSX.read(await f.arrayBuffer(),{type:'array'});sheetName=workbook.SheetNames[0];
      rows=XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{defval:'',raw:false});
    }
    const {parsed,skipped}=rowsToCargos(rows);
    if(!parsed.length)throw new Error('未找到有效数据，请确认表头包含长、宽、高、数量');
    cargos=parsed;renderRows();updateAll();
    $('#fileState').textContent=`已导入 ${f.name} · ${parsed.length} 行`;
    $('#importTitle').textContent=`${parsed.length} 个 SKU 已导入并展示`;
    $('#importMeta').textContent=`工作表：${sheetName}${skipped?` · 跳过 ${skipped} 行尺寸不完整的数据`:''} · 右侧 3D 已同步更新`;
    $('#importSummary').hidden=false;
    showToast(`导入完成：${parsed.length} 个 SKU 已立即显示`);
  }catch(err){
    $('#fileState').textContent='导入失败';showToast(err.message||'文件读取失败，请检查格式');
  }
};

function download(name,content){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
$('#templateBtn').onclick=()=>download('柜算_产品尺寸导入模板.csv','订单号,SKU,产品名称,包装长mm,包装宽mm,包装高mm,数量,单件毛重kg,允许旋转,可堆叠,易碎品\nPO-2026-1020-A,SOFA-301-A,三人位沙发主体箱,1980,820,610,24,65,是,否,否');

let angle=-7;function updateAngle(){$('#container3d').style.transform=`rotateX(7deg) rotateY(${angle}deg)`}$('#rotateLeft').onclick=()=>{angle-=9;updateAngle()};$('#rotateRight').onclick=()=>{angle+=9;updateAngle()};

function runOptimization(){
  if(!cargos.length){showToast('请先录入或导入产品数据');return}
  const modal=$('#optModal'),bar=$('#modalProgress'),txt=$('#optText');modal.classList.add('show');bar.style.width='4%';
  const phases=[['检查产品尺寸、数量与重量…','23%'],['尝试 20GP / 40GP / 40HQ / 45HQ…','48%'],['计算旋转、堆叠与重心约束…','73%'],['生成 3D 堆放效果与装柜顺序…','100%']];let i=0;
  const timer=setInterval(()=>{txt.textContent=phases[i][0];bar.style.width=phases[i][1];i++;if(i===phases.length){clearInterval(timer);setTimeout(()=>{modal.classList.remove('show');const r=updateDemoResult();render3D(true);showToast(`演示方案已生成：${r.type} × ${r.count}，空间利用率 ${r.util.toFixed(1)}%`)},550)}},500);
}
$('#runBtn').onclick=runOptimization;$('#topOptimize').onclick=runOptimization;

$('#playBtn').onclick=()=>{let i=0,items=$$('#steps li');const timer=setInterval(()=>{items.forEach((x,j)=>x.classList.toggle('active',j===i));i++;if(i>=items.length){clearInterval(timer);showToast('装柜顺序演示播放完成')}},800)};
$$('.alternatives button').forEach(b=>b.onclick=()=>{$$('.alternatives button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');showToast('已切换柜型对比；右上角推荐仍为演示最优方案')});
$('#excelReport').onclick=()=>{const r=updateDemoResult();download('柜算_排柜结果_演示.csv',`字段,结果\n方案编号,GS-20261020-01\n订单号,PO-2026-1020-A\n数据性质,演示计算（非真实装箱结果）\n推荐柜型,${r.type} × ${r.count}\n空间利用率,${r.util.toFixed(1)}%\n包装件数,${r.t.qty}\n总重,${r.t.weight.toFixed(1)}t`)};
$('#pdfReport').onclick=()=>{showToast('正在打开打印视图，可选择“另存为 PDF”');setTimeout(()=>window.print(),350)};

