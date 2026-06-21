let isDark=true,products=[],pid=0,orders=[],empName='',compName='',setupComplete=false;

function showAlert(title, message) {
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-msg').textContent = message;
  document.getElementById('custom-alert').classList.add('show');
}

function closeAlert() {
  document.getElementById('custom-alert').classList.remove('show');
}

function toggleTheme(){
  isDark=!isDark;
  document.getElementById('app').className='wrap '+(isDark?'':'light');
  document.getElementById('th-icon').className=isDark?'ti ti-sun':'ti ti-moon';
}

function goTo(p){
  if((p==='order'||p==='dash')&&!setupComplete){
    showAlert('Navigation Restricted', 'Please complete the profile Setup first before exploring other sections.');
    return;
  }
  ['setup','order','dash'].forEach(x=>{
    document.getElementById('pg-'+x).classList.remove('active');
    document.getElementById('nl-'+x).classList.remove('active');
  });
  document.getElementById('pg-'+p).classList.add('active');
  document.getElementById('nl-'+p).classList.add('active');
  if(p==='dash')renderDash();
}

function updateBadge(){
  const e=document.getElementById('s-emp').value.trim();
  const c=document.getElementById('s-comp').value.trim();
  const w=document.getElementById('setup-badge');
  if(e||c){w.style.display='block';document.getElementById('badge-txt').textContent=(e||'—')+' · '+(c||'—');}
  else w.style.display='none';
}

function saveSetup(){
  empName=document.getElementById('s-emp').value.trim();
  compName=document.getElementById('s-comp').value.trim();
  if(!empName||!compName){
    showAlert('Required Fields', 'Both Employee Name and Company Name fields are required to proceed.');
    return;
  }
  setupComplete=true;
  const bar=document.getElementById('emp-bar');
  document.getElementById('emp-bar-txt').textContent=empName+' · '+compName;
  bar.style.display='flex';
  document.getElementById('nl-order').disabled=false;
  document.getElementById('nl-dash').disabled=false;
  showToast('✓ Profile saved!');
  setTimeout(()=>goTo('order'),700);
}

function addProduct(){
  const name=document.getElementById('np').value.trim();
  const qty=parseInt(document.getElementById('nq').value)||1;
  const price=parseFloat(document.getElementById('npr').value)||0;
  if(!name){
    showAlert('Missing Parameter', 'Please fill in the Product Name field before adding.');
    return;
  }
  if(price<=0){
    showAlert('Invalid Price', 'The product price must be a valid number greater than 0.');
    return;
  }
  products.push({id:pid++,name,qty,price});
  document.getElementById('np').value='';
  document.getElementById('nq').value='1';
  document.getElementById('npr').value='';
  renderTable();
}

function removeProduct(id){products=products.filter(p=>p.id!==id);renderTable();}

function updateField(id,f,v){
  const p=products.find(p=>p.id===id);if(!p)return;
  if(f==='q')p.qty=Math.max(1,parseInt(v)||1);
  if(f==='p')p.price=Math.max(0,parseFloat(v)||0);
  renderTable();
}

function renderTable(){
  const tb=document.getElementById('ptbody');
  if(!products.length){tb.innerHTML='<tr class="empty-r"><td colspan="5">No products added yet</td></tr>';setTotals(0);return;}
  let sub=0;
  tb.innerHTML=products.map(p=>{const s=p.qty*p.price;sub+=s;return`<tr>
    <td class="cn" style="font-weight:500;">${esc(p.name)}</td>
    <td class="cq"><input class="iinput" type="number" min="1" value="${p.qty}" style="width:46px;" onchange="updateField(${p.id},'q',this.value)"></td>
    <td class="cp"><input class="iinput" type="number" min="0" step="0.01" value="${p.price.toFixed(2)}" style="width:62px;" onchange="updateField(${p.id},'p',this.value)"></td>
    <td class="cs">$${s.toFixed(2)}</td>
    <td class="cd"><button class="del-btn" onclick="removeProduct(${p.id})" aria-label="Remove">Remove</button></td>
  </tr>`;}).join('');
  setTotals(sub);
}

function setTotals(net){
  document.getElementById('t-net').textContent='$'+net.toFixed(2);
  document.getElementById('t-tax').textContent='$'+(net*.13).toFixed(2);
  document.getElementById('t-gross').textContent='$'+(net*1.13).toFixed(2);
}

function generateOrder(){
  if(!empName){
    showAlert('Profile Setup Required', 'Complete your system setup profile before generating orders.');
    return;
  }
  const name=document.getElementById('c-name').value.trim();
  const email=document.getElementById('c-email').value.trim();
  const phone=document.getElementById('c-phone').value.trim();
  const addr=document.getElementById('c-addr').value.trim();
  
  if(!name||!email||!phone||!addr){
    showAlert('Incomplete Information', 'All customer parameters (Name, Email, Phone, and Address) must be filled out to continue.');
    return;
  }
  
  const allowedDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'live.com'];
  const emailParts = email.split('@');
  
  if(emailParts.length !== 2 || !allowedDomains.includes(emailParts[1].toLowerCase())){
    showAlert('Invalid Email Domain', 'The email address must include a valid format with an "@" character followed by a recognized domain provider (e.g., gmail.com, hotmail.com, yahoo.com).');
    return;
  }
  
  if(!products.length){
    showAlert('Empty Product List', 'You must add at least one item to the products summary table to generate a new transaction.');
    return;
  }
  
  const net=products.reduce((s,p)=>s+p.qty*p.price,0);
  const now=new Date();
  const oid='ORD-'+String(orders.length+1).padStart(3,'0');
  orders.push({
    id:oid,customer:{name,email,phone,addr},employee:empName,company:compName,
    products:[...products],net,tax:net*.13,gross:net*1.13,status:'pending',
    date:now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  });
  products=[];pid=0;
  ['c-name','c-email','c-phone','c-addr'].forEach(x=>document.getElementById(x).value='');
  renderTable();
  showToast('✓ '+oid+' created!');
  setTimeout(()=>goTo('dash'),800);
}

// FINALIZAR UNA ORDEN
function finishOrder(oid){
  const o=orders.find(x=>x.id===oid);
  if(!o) return;
  if(o.status==='finished'){
    showAlert('Already Finished', 'This transaction has already been completed and processed.');
    return;
  }
  o.status='finished';
  showToast('✓ Order marked as Finished');
  renderDash();
}

// ELIMINAR UNA ORDEN DEFINITIVAMENTE
function deleteOrder(oid){
  orders=orders.filter(x=>x.id!==oid);
  showToast('✕ Order deleted successfully');
  renderDash();
}

function renderDash(){
  const rev=orders.reduce((s,o)=>s+o.net,0);
  const tot=orders.reduce((s,o)=>s+o.gross,0);
  document.getElementById('m-count').textContent=orders.length;
  document.getElementById('m-rev').textContent='$'+rev.toFixed(2);
  document.getElementById('m-total').textContent='$'+tot.toFixed(2);
  const g=document.getElementById('orders-grid');
  if(!orders.length){g.innerHTML='<div class="no-orders"><i class="ti ti-inbox" aria-hidden="true"></i>No orders yet — go create one!</div>';return;}
  g.innerHTML=orders.slice().reverse().map(o=>`
    <div class="ocard">
      <div class="ocard-top">
        <div><div class="o-id">${o.id} · ${o.date}</div><div class="o-name">${esc(o.customer.name)}</div></div>
        <span class="st-pill st-${o.status}">${o.status}</span>
      </div>
      <div class="o-meta">
        <span><i class="ti ti-mail" aria-hidden="true"></i>${esc(o.customer.email)}</span>
        <span><i class="ti ti-phone" aria-hidden="true"></i>${esc(o.customer.phone)}</span>
        <span><i class="ti ti-map-pin" aria-hidden="true"></i>${esc(o.customer.addr)}</span>
      </div>
      <div class="o-chips">${o.products.map(p=>`<span class="o-chip">${esc(p.name)} ×${p.qty}</span>`).join('')}</div>
      <div class="o-footer">
        <div class="o-total">$${o.gross.toFixed(2)}<small>incl. 13% tax</small></div>
        <div class="o-actions">
          <button class="action-btn btn-finish" onclick="finishOrder('${o.id}')" title="Order Finished"><i class="ti ti-circle-check"></i> Finished</button>
          <button class="action-btn btn-delete" onclick="deleteOrder('${o.id}')" title="Delete Order"><i class="ti ti-trash"></i> Delete</button>
          <button class="pdf-btn" onclick="exportPDF('${o.id}')"><i class="ti ti-file-type-pdf" aria-hidden="true"></i> PDF</button>
        </div>
      </div>
    </div>
  `).join('');
}

function exportPDF(oid){
  const o=orders.find(x=>x.id===oid);if(!o)return;
  const rows=o.products.map(p=>`<tr><td>${esc(p.name)}</td><td style="text-align:center">${p.qty}</td><td style="text-align:right">$${p.price.toFixed(2)}</td><td style="text-align:right">$${(p.qty*p.price).toFixed(2)}</td></tr>`).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${o.id}</title><style>
    body{font-family:Arial,sans-serif;padding:40px;color:#1a1a2e;max-width:680px;margin:0 auto;}
    .logo{font-size:22px;font-weight:700;color:#1a6fd4;margin-bottom:2px;}
    .sub{font-size:12px;color:#64748b;margin-bottom:28px;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin-bottom:24px;}
    .lbl{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.4px;}
    .val{font-size:13px;color:#1a1a2e;margin-top:1px;}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;}
    thead tr{background:#f0f6ff;}
    th{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;padding:8px 9px;text-align:left;border-bottom:2px solid #1a6fd4;}
    td{padding:8px 9px;font-size:13px;border-bottom:1px solid #e8f1fc;}
    .tt td{border:none;padding:4px 9px;font-size:13px;}
    .tt tr.fin td{font-size:15px;font-weight:700;color:#1a6fd4;border-top:2px solid #1a6fd4;padding-top:9px;}
    .foot{margin-top:32px;font-size:11px;color:#94a3b8;border-top:1px solid #e8f1fc;padding-top:10px;}
  </style></head><body>
  <div class="logo">OrderFlow</div>
  <div class="sub">${esc(o.company)} · Rep: ${esc(o.employee)}</div>
  <div class="grid">
    <div><div class="lbl">Order</div><div class="val">${o.id}</div></div>
    <div><div class="lbl">Date</div><div class="val">${o.date}</div></div>
    <div><div class="lbl">Customer</div><div class="val">${esc(o.customer.name)}</div></div>
    <div><div class="lbl">Phone</div><div class="val">${esc(o.customer.phone)}</div></div>
    <div><div class="lbl">Email</div><div class="val">${esc(o.customer.email)}</div></div>
    <div><div class="lbl">Address</div><div class="val">${esc(o.customer.addr)}</div></div>
  </div>
  <table><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit price</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="tt" style="width:240px;margin-left:auto;">
    <tr><td>Subtotal</td><td style="text-align:right">$${o.net.toFixed(2)}</td></tr>
    <tr><td>Tax (13%)</td><td style="text-align:right">$${o.tax.toFixed(2)}</td></tr>
    <tr class="fin"><td>Total</td><td style="text-align:right">$${o.gross.toFixed(2)}</td></tr>
  </table>
  <div class="foot">OrderFlow · ${esc(o.company)} · ${o.id} · ${o.date}</div>
  </body></html>`;
  const w=window.open('','_blank','width=780,height=600');
  if(w){w.document.write(html);w.document.close();setTimeout(()=>w.print(),400);}
  else showAlert('Browser Blocked Popup', 'Please allow popups for this page to export and print the order PDF invoice document.');
}

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}