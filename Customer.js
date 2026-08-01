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
  isDark = !isDark;
  document.getElementById('app').className = 'wrap ' + (isDark ? '' : 'light');
  
  // Nodos de los emojis en la interfaz
  const thEmoji = document.getElementById('th-emoji');
  const setupEmoji = document.getElementById('emoji-setup');
  const orderEmoji = document.getElementById('emoji-order');
  const dashEmoji = document.getElementById('emoji-dash');

  if (isDark) {
    // Emojis para el modo oscuro
    if (thEmoji) thEmoji.textContent = '🌙';
    if (setupEmoji) setupEmoji.textContent = '👨‍💼';
    if (orderEmoji) orderEmoji.textContent = '🛒';
    if (dashEmoji) dashEmoji.textContent = '📈';
  } else {
    // Emojis para el modo claro
    if (thEmoji) thEmoji.textContent = '☀️';
    if (setupEmoji) setupEmoji.textContent = '👤';
    if (orderEmoji) orderEmoji.textContent = '📝';
    if (dashEmoji) dashEmoji.textContent = '📊';
  }
}

function updateBadge(){
  const e=document.getElementById('s-emp').value.trim();
  const c=document.getElementById('s-comp').value.trim();
  const w=document.getElementById('setup-badge');
  if(e||c){w.style.display='block';document.getElementById('badge-txt').textContent=(e||'—')+' · '+(c||'—');}
  else w.style.display='none';
}

function togglePaymentFields(){
  const method=document.getElementById('payment-method').value;
  const cashField=document.getElementById('cash-amount-field');
  const cardField=document.getElementById('card-number-field');
  if(method==='cash'){cashField.style.display='flex';cardField.style.display='none';}
  else{cashField.style.display='none';cardField.style.display='flex';}
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
    <td class="cd"><button class="del-btn" onclick="removeProduct(${p.id})" aria-label="Remove">❌ Remove</button></td>
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

  const paymentMethod=document.getElementById('payment-method').value;
  let payment={method:paymentMethod};
  if(paymentMethod==='cash'){
    const cashAmount=parseFloat(document.getElementById('cash-amount').value)||0;
    if(cashAmount<=0){showAlert('Missing Cash Amount', 'Please enter a valid cash amount greater than 0.');return;}
    payment.cashAmount=cashAmount;
  } else {
    const cardNumber=document.getElementById('card-number').value.trim();
    if(!cardNumber){showAlert('Missing Card Number', 'Please enter the credit card number to continue.');return;}
    payment.cardNumber=cardNumber;
  }
  
  const net=products.reduce((s,p)=>s+p.qty*p.price,0);
  const now=new Date();
  const oid='ORD-'+String(orders.length+1).padStart(3,'0');
  orders.push({
    id:oid,customer:{name,email,phone,addr},employee:empName,company:compName,
    products:[...products],net,tax:net*.13,gross:net*1.13,status:'pending',payment,
    date:now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  });
  products=[];pid=0;
  ['c-name','c-email','c-phone','c-addr','cash-amount','card-number'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('payment-method').value='cash';
  togglePaymentFields();
  renderTable();
  showToast('✓ '+oid+' created!');
  // ¡DISPARAR LLUVIA DE DINERO JUSTO AQUÍ!
  triggerMoneyRain();
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
  
// SI NO HAY ÓRDENES: Inyectamos el viejo oeste dinámico con el nuevo arte realista
  if(!orders.length){
    g.innerHTML=`
      <div class="no-orders">
        <div class="wild-west-container" id="west-stage">
          <!-- Decoración: Cactus del desierto -->
          <div class="desert-cactus cactus-1">🌵</div>
          <div class="desert-cactus cactus-2">🌵</div>
          <div class="desert-cactus cactus-3">🌵</div>
          
          <!-- Arbustos compactos con texturas de ramas vectoriales -->
          <div class="tumbleweed" id="weed1"></div>
          <div class="tumbleweed" id="weed2"></div>
          <div class="desert-sand"></div>
        </div>
        <div class="west-text">"I don't see the green ones over here"</div>
      </div>
    `;
    // Encendemos las físicas adaptadas a la nueva escala compacta
    initTumbleweeds();
    return;
  }
  
  // Si hay órdenes, renderiza normal...
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
        <span><i class="ti ti-credit-card" aria-hidden="true"></i>${o.payment.method==='cash' ? 'Cash · $'+o.payment.cashAmount.toFixed(2) : 'Card · •••• '+String(o.payment.cardNumber).slice(-4)}</span>
      </div>
      <div class="o-chips">${o.products.map(p=>`<span class="o-chip">${esc(p.name)} ×${p.qty}</span>`).join('')}</div>
      <div class="o-footer">
        <div class="o-total">$${o.gross.toFixed(2)}<small>incl. 13% tax</small></div>
        <div class="o-actions">
          <button class="action-btn btn-finish" onclick="finishOrder('${o.id}')" title="Order Finished"><i class="ti ti-circle-check"></i> ✅ Finished</button>
          <button class="action-btn btn-delete" onclick="deleteOrder('${o.id}')" title="Delete Order"><i class="ti ti-trash"></i> 🗑️ Delete</button>
          <button class="pdf-btn" onclick="exportPDF('${o.id}')"><i class="ti ti-file-type-pdf" aria-hidden="true"></i> 📄 PDF</button>
        </div>
      </div>
    </div>
  `).join('');
}

function exportPDF(oid){
  const o=orders.find(x=>x.id===oid); if(!o) return;
  
  const rows=o.products.map(p=>`
    <tr>
      <td style="font-weight: 500; color: #1e293b;">${esc(p.name)}</td>
      <td style="text-align: center; color: #475569;">${p.qty}</td>
      <td style="text-align: right; color: #475569;">$${p.price.toFixed(2)}</td>
      <td style="text-align: right; font-weight: 600; color: #0f172a;">$${(p.qty*p.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const html=`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Comprobante ${o.id}</title>
    <style>
      @page {
        size: A4;
        margin: 0; /* Dejamos el margen en 0 para controlarlo perfectamente por CSS */
      }
      *, *::before, *::after { box-sizing: border-box; }
      
      /* Contenedor principal para alejar todo de las orillas de la hoja */
      .page-wrapper {
        padding: 28mm 24mm; /* Más separación arriba/abajo y generosa a los lados */
        width: 100%;
        min-height: 100vh;
        background: #ffffff;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 0; padding: 0; color: #1e293b; font-size: 13px; line-height: 1.5;
      }
      
      /* Encabezado */
      .header-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
      .brand-title { font-size: 28px; font-weight: 800; color: #1a6fd4; letter-spacing: -0.5px; margin: 0; }
      .brand-subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
      .invoice-title { font-size: 20px; font-weight: 700; color: #0f172a; text-align: right; margin: 0; letter-spacing: 0.5px; }
      .invoice-id { font-size: 14px; font-weight: 700; color: #e05580; text-align: right; margin-top: 4px; }
      
      /* Bloques de Información */
      .info-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
      .info-cell { width: 50%; vertical-align: top; }
      .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-right: 12px; }
      .info-box.right { margin-right: 0; margin-left: 12px; }
      .sec-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1a6fd4; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
      .info-row { margin-bottom: 6px; font-size: 13px; }
      .info-lbl { color: #64748b; font-weight: 500; display: inline-block; width: 85px; }
      .info-val { color: #1e293b; font-weight: 600; }
      
      /* Tabla de Productos */
      .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .items-table th { background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 14px; text-align: left; }
      .items-table th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
      .items-table th:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; text-align: right; }
      .items-table td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
      
      /* Totales */
      .summary-table { width: 260px; margin-left: auto; border-collapse: collapse; margin-top: 20px; }
      .summary-table td { padding: 6px 10px; font-size: 13px; color: #475569; }
      .summary-table .lbl { text-align: right; font-weight: 500; }
      .summary-table .val { text-align: right; font-weight: 600; width: 110px; color: #1e293b; }
      .summary-table tr.total-row td { font-size: 16px; font-weight: 700; color: #1a6fd4; border-top: 2px solid #1a6fd4; padding-top: 10px; }
      
      /* Pie de Página */
      .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 500; }
    </style>
  </head>
  <body>
    <!-- Envoltura con márgenes reforzados -->
    <div class="page-wrapper">

      <!-- Encabezado Principal -->
      <table class="header-table">
        <tr>
          <td>
            <div class="brand-title">OrderFlow</div>
            <div class="brand-subtitle">Empresa: <strong>${esc(o.company)}</strong> &middot; Agente: <strong>${esc(o.employee)}</strong></div>
          </td>
          <td style="vertical-align: top;">
            <div class="invoice-title">COMPROBANTE DE COMPRA</div>
            <div class="invoice-id">${o.id}</div>
          </td>
        </tr>
      </table>

      <!-- Grid de Datos Básicos y del Cliente -->
      <table class="info-table">
        <tr>
          <td class="info-cell">
            <div class="info-box">
              <h2 class="sec-title">Detalles del Pedido</h2>
              <div class="info-row"><span class="info-lbl">Fecha:</span><span class="info-val">${o.date}</span></div>
              <div class="info-row"><span class="info-lbl">Estado:</span><span class="info-val" style="color:#166534; text-transform:capitalize;">${o.status}</span></div>
              <div class="info-row"><span class="info-lbl">Método Pago:</span><span class="info-val">${o.payment.method==='cash' ? 'Efectivo' : 'Tarjeta'}</span></div>
              <div class="info-row"><span class="info-lbl">Referencia:</span><span class="info-val">${o.payment.method==='cash' ? '$'+o.payment.cashAmount.toFixed(2) : '•••• '+String(o.payment.cardNumber).slice(-4)}</span></div>
            </div>
          </td>
          <td class="info-cell">
            <div class="info-box right">
              <h2 class="sec-title">Información del Cliente</h2>
              <div class="info-row"><span class="info-lbl">Nombre:</span><span class="info-val">${esc(o.customer.name)}</span></div>
              <div class="info-row"><span class="info-lbl">Teléfono:</span><span class="info-val">${esc(o.customer.phone)}</span></div>
              <div class="info-row"><span class="info-lbl">Email:</span><span class="info-val" style="font-weight:500;">${esc(o.customer.email)}</span></div>
              <div class="info-row"><span class="info-lbl">Dirección:</span><span class="info-val">${esc(o.customer.addr)}</span></div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Tabla de Artículos -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50%;">Descripción del Producto</th>
            <th style="width: 15%; text-align: center;">Cant.</th>
            <th style="width: 15%; text-align: right;">Precio Unit.</th>
            <th style="width: 20%; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Desglose de Totales Financieros -->
      <table class="summary-table">
        <tr>
          <td class="lbl">Subtotal neto</td>
          <td class="val">$${o.net.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="lbl">IVA / Impuestos (13%)</td>
          <td class="val">$${o.tax.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td class="lbl">Total a Pagar</td>
          <td class="val">$${o.gross.toFixed(2)}</td>
        </tr>
      </table>

      <!-- Pie de Página Fijo -->
      <div class="footer">
        Documento electrónico emitido por OrderFlow &middot; ¡Gracias por su confianza y preferencia!
      </div>

    </div>
  </body>
  </html>`;

  const w=window.open('','_blank','width=850,height=700');
  if(w){
    w.document.write(html);
    w.document.close();
    setTimeout(()=>w.print(), 350);
  } else {
    showAlert('Browser Blocked Popup', 'Please allow popups for this page to export and print the order PDF invoice document.');
  }
}

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

togglePaymentFields();

//GSAP Animations
//Hero animation-------
window.addEventListener('DOMContentLoaded', () => {
  gsap.from(".setup-hero", { 
    duration: 1, 
    y: 30, 
    opacity: 0, 
    ease: "power3.out" 
  });
  
  gsap.from(".pg-setup .card", { 
    duration: 1, 
    y: 50, 
    opacity: 0, 
    delay: 0.2, 
    ease: "power3.out" 
  });
});

//Navigation animation-------
function goTo(p){
  if((p==='order'||p==='dash')&&!setupComplete){
    showAlert('Navigation Restricted', 'Please complete the profile Setup first before exploring other sections.');
    return;
  }
  
  ['setup','order','dash'].forEach(x=>{
    document.getElementById('pg-'+x).classList.remove('active');
    document.getElementById('nl-'+x).classList.remove('active');
  });
  
  const nextPage = document.getElementById('pg-'+p);
  nextPage.classList.add('active');
  document.getElementById('nl-'+p).classList.add('active');
  
  gsap.fromTo(nextPage, 
    { opacity: 0, x: 20 }, 
    { duration: 0.4, opacity: 1, x: 0, ease: "power2.out" }
  );

  if(p==='dash') renderDash();
}

//Animation for toast notifications
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  
  // Reseteamos el estado con GSAP y lo hacemos visible
  gsap.killTweensOf(t); // Por si se da click rápido seguidamente
  t.classList.add('show');
  
  // Animación de entrada (Slide down + Fade in)
  gsap.fromTo(t, 
    { y: -50, opacity: 0 },
    { duration: 0.5, y: 0, opacity: 1, ease: "back.out(1.7)" }
  );
  
  // Animación de salida después de 3 segundos
  gsap.to(t, {
    delay: 2.7,
    duration: 0.3,
    opacity: 0,
    y: -20,
    onComplete: () => t.classList.remove('show')
  });
}

//Animation for alert modal
function showAlert(title, message) {
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-msg').textContent = message;
  
  const overlay = document.getElementById('custom-alert');
  const modal = overlay.querySelector('.alert-modal');
  
  overlay.classList.add('show');
  
  // Animamos el fondo negro (fade in)
  gsap.fromTo(overlay, { opacity: 0 }, { duration: 0.2, opacity: 1 });
  // Animamos el modal interior (de chiquito a grande con rebote)
  gsap.fromTo(modal, 
    { scale: 0.7, opacity: 0 }, 
    { duration: 0.4, scale: 1, opacity: 1, ease: "back.out(1.5)" }
  );
}

function closeAlert() {
  const overlay = document.getElementById('custom-alert');
  const modal = overlay.querySelector('.alert-modal');
  
  // Animación de salida fluida antes de ocultar el elemento
  gsap.to(modal, { duration: 0.2, scale: 0.8, opacity: 0 });
  gsap.to(overlay, { 
    duration: 0.2, 
    opacity: 0, 
    onComplete: () => overlay.classList.remove('show') 
  });
}

//Payment animation
function togglePaymentFields(){
  const method = document.getElementById('payment-method').value;
  const cashField = document.getElementById('cash-amount-field');
  const cardField = document.getElementById('card-number-field');
  
  if(method === 'cash'){
    cardField.style.display = 'none';
    cashField.style.display = 'flex';
    gsap.fromTo(cashField, { opacity: 0, y: -10 }, { duration: 0.3, opacity: 1, y: 0 });
  } else {
    cashField.style.display = 'none';
    cardField.style.display = 'flex';
    gsap.fromTo(cardField, { opacity: 0, y: -10 }, { duration: 0.3, opacity: 1, y: 0 });
  }
}
// ==========================================
// ANIMACIONES CONSTANTES Y MICRO-INTERACCIONES
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  // 1. Animación constante (Loop infinito de respiración/flotado en el icono de Setup)
  if (document.querySelector('.setup-icon i')) {
    gsap.to(".setup-icon i", {
      y: -6,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
  }

  // 2. Animación de respiración constante al logo de la Navbar (Brand)
  gsap.to(".nav-brand i", {
    scale: 1.1,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut"
  });

  // 3. Animación constante tipo pulso sutil en los botones primarios activos
  gsap.to(".primary-btn", {
    boxShadow: "0 6px 20px rgba(26, 111, 212, 0.4)",
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
  
  // 4. Animación inicial suave para toda la Navbar al cargar la página
  gsap.from(".navbar", {
    y: -20,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out"
  });
});

function goTo(p){
  // 1. Validar si el usuario completó el Setup
  if((p==='order'||p==='dash')&&!setupComplete){
    showAlert('Navigation Restricted', 'Please complete the profile Setup first before exploring other sections.');
    return;
  }
  
  // 2. Remover clases activas de todas las páginas y enlaces de navegación
  ['setup','order','dash'].forEach(x=>{
    document.getElementById('pg-'+x).classList.remove('active');
    document.getElementById('nl-'+x).classList.remove('active');
  });
  
  // 3. Activar la página seleccionada
  const nextPage = document.getElementById('pg-'+p);
  nextPage.classList.add('active');
  document.getElementById('nl-'+p).classList.add('active');
  
  // 4. Animación constante de entrada con GSAP (Fade In + Desplazamiento sutil)
  gsap.fromTo(nextPage, 
    { opacity: 0, x: 15 }, 
    { duration: 0.4, opacity: 1, x: 0, ease: "power2.out" }
  );

  // 5. Animación en cascada opcional para los elementos internos de la pestaña activa
  gsap.from(nextPage.querySelectorAll('.field, .card, .mcard'), {
    duration: 0.4,
    y: 15,
    opacity: 0,
    stagger: 0.05,
    ease: "power3.out",
    clearProps: "all" // Limpia las propiedades para que no afecte estilos CSS nativos
  });

  // 6. Si es el dashboard, renderizar los datos
  if(p==='dash') renderDash();
} 

// Actualización en el Toast (Controlado 100% por GSAP, invisible al iniciar)
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  
  gsap.killTweensOf(t);
  t.classList.add('show');
  
  // Entra flotando de abajo hacia arriba en su eje fijo sin romper layouts
  gsap.fromTo(t, 
    { y: 50, opacity: 0, scale: 0.8 },
    { duration: 0.4, y: 0, opacity: 1, scale: 1, ease: "back.out(1.5)" }
  );
  
  // Se desvanece suavemente al terminar
  gsap.to(t, {
    delay: 2.5,
    duration: 0.3,
    opacity: 0,
    y: 20,
    scale: 0.95,
    onComplete: () => t.classList.remove('show')
  });
}

// --- LÓGICA DE FÍSICAS REBOTANTES ADAPTADAS A TAMAÑO REDUCIDO Y LENTO ---
function initTumbleweeds() {
  const stage = document.getElementById('west-stage');
  const w1 = document.getElementById('weed1');
  const w2 = document.getElementById('weed2');
  if(!stage || !w1 || !w2) return;

  const stageW = stage.clientWidth;
  
  // Tamaño cambiado a 35 para hacer match perfecto con el CSS reducido
  let pos1 = { x: stageW * 0.15, y: 0, vx: 1.1, size: 35 };
  let pos2 = { x: stageW * 0.75, y: 0, vx: -0.9, size: 35 };

  gsap.ticker.remove(updateLoop);

  function updateLoop() {
    if (!document.getElementById('west-stage')) {
      gsap.ticker.remove(updateLoop);
      return;
    }

    const currentWidth = stage.clientWidth;

    pos1.x += pos1.vx;
    pos2.x += pos2.vx;

    // Saltos orgánicos pausados y proporcionales a su tamaño
    pos1.y = Math.abs(Math.sin(pos1.x * 0.025)) * 16;
    pos2.y = Math.abs(Math.sin(pos2.x * 0.022)) * 14;

    if (pos1.x <= 0) { pos1.x = 0; pos1.vx *= -1; }
    if (pos1.x >= currentWidth - pos1.size) { pos1.x = currentWidth - pos1.size; pos1.vx *= -1; }

    if (pos2.x <= 0) { pos2.x = 0; pos2.vx *= -1; }
    if (pos2.x >= currentWidth - pos2.size) { pos2.x = currentWidth - pos2.size; pos2.vx *= -1; }

    let dist = Math.abs(pos1.x - pos2.x);
    if (dist < pos1.size) {
      let temp = pos1.vx;
      pos1.vx = pos2.vx;
      pos2.vx = temp;

      if(pos1.x < pos2.x) {
        pos1.x -= 1; pos2.x += 1;
      } else {
        pos1.x += 1; pos2.x -= 1;
      }
    }

    gsap.set(w1, { x: pos1.x, y: -pos1.y, rotation: pos1.x * 1.5 });
    gsap.set(w2, { x: pos2.x, y: -pos2.y, rotation: pos2.x * -1.5 });
  }

  gsap.ticker.add(updateLoop);
}

// --- LÓGICA DE LA LLUVIA DE EMOJIS DE DINERO ---
function triggerMoneyRain() {
  // Crear contenedor temporal en el body
  const rainContainer = document.createElement('div');
  rainContainer.className = 'money-rain-container';
  document.body.appendChild(rainContainer);

  const emojis = ['💰', '💵', '💸', '🤑', '🪙'];
  const count = 45; // Cantidad de billetes/bolsas cayendo

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'money-emoji';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Distribución horizontal aleatoria uniforme
    const randomX = Math.random() * 100; 
    el.style.left = randomX + 'vw';
    el.style.top = '-50px';
    
    rainContainer.appendChild(el);

    // Velocidades y rotaciones orgánicas aleatorias por cada emoji
    const duration = gsap.utils.random(2.0, 3.8);
    const delay = gsap.utils.random(0, 0.6);
    const rotation = gsap.utils.random(-360, 360);
    const driftX = gsap.utils.random(-80, 80); // Desvío de lado a lado en la caída

    // Animación física de caída con desvanecimiento simultáneo (Fade out)
    gsap.to(el, {
      y: window.innerHeight + 100,
      x: driftX,
      rotation: rotation,
      duration: duration,
      delay: delay,
      ease: "power1.in",
    });

    // Van desapareciendo gradualmente a medida que bajan
    gsap.to(el, {
      opacity: 0,
      duration: duration * 0.4,
      delay: delay + (duration * 0.6), // Inicia el fade out pasando la mitad del camino
      ease: "power1.out"
    });
  }

  // Auto-destrucción del contenedor del DOM al terminar la lluvia completa
  setTimeout(() => {
    rainContainer.remove();
  }, 4500);
}