const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

let cargos=[
 {name:'三人位沙发主体箱',sku:'SOFA-301-A',l:1980,w:820,h:610,qty:18,kg:65,rotate:true,stack:false,icon:'沙'},
 {name:'贵妃位沙发主体箱',sku:'SOFA-301-B',l:1640,w:920,h:620,qty:18,kg:58,rotate:true,stack:false,icon:'妃'},
 {name:'1.6m 岩板餐桌',sku:'TABLE-160-G',l:1680,w:920,h:180,qty:18,kg:52,rotate:true,stack:true,icon:'桌'},
 {name:'餐椅双装箱',sku:'CHAIR-LN-02',l:650,w:520,h:900,qty:54,kg:24,rotate:true,stack:true,icon:'椅'},
 {name:'圆形脚凳',sku:'STOOL-RD-01',l:660,w:660,h:450,qty:54,kg:12,rotate:true,stack:true,icon:'凳'},
 {name:'茶几面板箱',sku:'TABLE-COF-01',l:1260,w:720,h:190,qty:24,kg:31,rotate:true,stack:true,icon:'几'}
];

function renderRows(){
  $('#cargoRows').innerHTML=cargos.map((c,i)=>`<tr data-i="${i}"><td><div class="product-name"><i>${c.icon}</i><div><b>${c.name}</b><small>${c.sku}</small></div></div></td><td><input class="data-input dim" data-k="l" type="number" value="${c.l}"></td><td><input class="data-input dim" data-k="w" type="number" value="${c.w}"></td><td><input class="data-input dim" data-k="h" type="number" value="${c.h}"></td><td><input class="data-input dim" data-k="qty" type="number" value="${c.qty}"></td><td><input class="data-input dim" data-k="kg" type="number" value="${c.kg}"></td><td><span class="switch ${c.rotate?'on':''}" data-k="rotate"></span></td><td><span class="switch ${c.stack?'on':''}" data-k="stack"></span></td><td><button class="remove">×</button></td></tr>`).join('');
  $$('.dim').forEach(el=>el.onchange=()=>{const i=+el.closest('tr').dataset.i;cargos[i][el.dataset.k]=+el.value;updateTotals()});
  $$('.switch').forEach(el=>el.onclick=()=>{const i=+el.closest('tr').dataset.i,k=el.dataset.k;cargos[i][k]=!cargos[i][k];el.classList.toggle('on',cargos[i][k])});
  $$('.remove').forEach(el=>el.onclick=()=>{cargos.splice(+el.closest('tr').dataset.i,1);renderRows();updateTotals();showToast('已从本次订单移除该产品')});
}

function updateTotals(){
  const qty=cargos.reduce((s,c)=>s+c.qty,0),weight=cargos.reduce((s,c)=>s+c.qty*c.kg,0)/1000;
  const rawVolume=cargos.reduce((s,c)=>s+c.l*c.w*c.h*c.qty/1e9,0);
  $('#skuCount').textContent=cargos.length;$('#packageCount').textContent=qty;$('#totalVolume').textContent=rawVolume.toFixed(1)+' m³';$('#totalWeight').textContent=weight.toFixed(1)+' t';
}
renderRows();updateTotals();

function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),2500)}
function showView(id){$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===id));$$('.view').forEach(x=>x.classList.toggle('active',x.id===id));window.scrollTo({top:0,behavior:'smooth'})}
$$('.nav-item').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$('#noticeClose').onclick=()=>$('.notice').remove();
$('#saveBtn').onclick=()=>showToast('项目草稿已保存在当前浏览器（演示）');

$$('.segmented').forEach(group=>$$('button',group).forEach(b=>b.onclick=()=>{$$('button',group).forEach(x=>x.classList.remove('active'));b.classList.add('active')}));

$('#addProduct').onclick=()=>{cargos.push({name:'新产品包装箱',sku:'NEW-SKU-'+String(cargos.length+1).padStart(2,'0'),l:1000,w:600,h:500,qty:1,kg:20,rotate:true,stack:true,icon:'新'});renderRows();updateTotals();showToast('已添加一行，请填写实际外包装尺寸')};
$('#importBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=()=>{const f=$('#fileInput').files[0];if(!f)return;$('#fileState').textContent='已读取 '+f.name;showToast('原型已接收文件；正式版将解析 Excel 并校验尺寸字段')};

function download(name,content){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8'}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('#templateBtn').onclick=()=>download('柜算_产品尺寸导入模板.csv','订单号,SKU,产品名称,包装长mm,包装宽mm,包装高mm,数量,单件毛重kg,允许旋转,可堆叠,易碎品\nPO-2026-1020-A,SOFA-301-A,三人位沙发主体箱,1980,820,610,24,65,是,否,否');

let angle=-7;function updateAngle(){ $('#container3d').style.transform=`rotateX(4deg) rotateY(${angle}deg)` }$('#rotateLeft').onclick=()=>{angle-=8;updateAngle()};$('#rotateRight').onclick=()=>{angle+=8;updateAngle()};

function runOptimization(){
  const modal=$('#optModal'),bar=$('#modalProgress'),txt=$('#optText');modal.classList.add('show');bar.style.width='4%';
  const phases=[['检查产品尺寸、数量与重量…','23%'],['尝试 20GP / 40GP / 40HQ / 45HQ…','48%'],['计算旋转、堆叠与重心约束…','73%'],['生成最高利用率方案与装柜顺序…','100%']];let i=0;
  const timer=setInterval(()=>{txt.textContent=phases[i][0];bar.style.width=phases[i][1];i++;if(i===phases.length){clearInterval(timer);setTimeout(()=>{modal.classList.remove('show');$('#recommendedType').textContent='40HQ × 1';$('#utilization').textContent='92.6%';$('#meterValue').textContent='92.6%';$('#meterBar').style.width='92.6%';showToast('演示方案已生成：推荐 40HQ × 1，利用率 92.6%')},650)}},600)
}
$('#runBtn').onclick=runOptimization;$('#topOptimize').onclick=runOptimization;

$('#playBtn').onclick=()=>{let i=0,items=$$('#steps li');const timer=setInterval(()=>{items.forEach((x,j)=>x.classList.toggle('active',j===i));i++;if(i>=items.length){clearInterval(timer);showToast('装柜顺序演示播放完成')}},800)};
$$('.alternatives button').forEach(b=>b.onclick=()=>{$$('.alternatives button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');showToast('已切换柜型对比；右上角推荐仍为最优方案')});
$('#excelReport').onclick=()=>download('柜算_排柜结果_演示.csv','字段,结果\n方案编号,GS-20261020-01\n订单号,PO-2026-1020-A\n数据性质,演示计算（非真实装箱结果）\n推荐柜型,40HQ × 1\n空间利用率,92.6%\n包装件数,186\n总重,5.8t');
$('#pdfReport').onclick=()=>{showToast('正在打开打印视图，可选择“另存为 PDF”');setTimeout(()=>window.print(),350)};

