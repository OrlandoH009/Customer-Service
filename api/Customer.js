// ============================================================
// GLOBAL VARIABLES
// ============================================================
let isDark = true,
  products = [],
  pid = 0,
  orders = [],
  empName = '',
  compName = '',
  setupComplete = false;
let appliedDiscountCode = null,
  discountPercent = 0;
const DISCOUNT_CODES = {
  'PLEASE': 0.50,
  'SAVE10': 0.10,
  'DISCOUNT15': 0.15
};

// ============================================================
// ALERT / TOAST / THEME / SETUP
// ============================================================
function showAlert(title, message) {
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-msg').textContent = message;
  document.getElementById('custom-alert').classList.add('show');
}

function closeAlert() {
  document.getElementById('custom-alert').classList.remove('show');
}

function toggleTheme() {
  isDark = !isDark;
  document.getElementById('app').className = 'wrap ' + (isDark ? '' : 'light');
  const thEmoji = document.getElementById('th-emoji');
  const setupEmoji = document.getElementById('emoji-setup');
  const orderEmoji = document.getElementById('emoji-order');
  const dashEmoji = document.getElementById('emoji-dash');
  if (isDark) {
    if (thEmoji) thEmoji.textContent = '🌙';
    if (setupEmoji) setupEmoji.textContent = '👨‍💼';
    if (orderEmoji) orderEmoji.textContent = '🛒';
    if (dashEmoji) dashEmoji.textContent = '📈';
  } else {
    if (thEmoji) thEmoji.textContent = '☀️';
    if (setupEmoji) setupEmoji.textContent = '👤';
    if (orderEmoji) orderEmoji.textContent = '📝';
    if (dashEmoji) dashEmoji.textContent = '📊';
  }
}

function updateBadge() {
  const e = document.getElementById('s-emp').value.trim();
  const c = document.getElementById('s-comp').value.trim();
  const w = document.getElementById('setup-badge');
  if (e || c) { 
    w.style.display = 'block';
    document.getElementById('badge-txt').textContent = (e || '—') + ' · ' + (c || '—'); 
  } else {
    w.style.display = 'none';
  }
}

function togglePaymentFields() {
  const method = document.getElementById('payment-method').value;
  const cashField = document.getElementById('cash-amount-field');
  const cardField = document.getElementById('card-number-field');
  if (method === 'cash') { 
    cashField.style.display = 'flex';
    cardField.style.display = 'none'; 
  } else { 
    cashField.style.display = 'none';
    cardField.style.display = 'flex'; 
  }
}

function saveSetup() {
  empName = document.getElementById('s-emp').value.trim();
  compName = document.getElementById('s-comp').value.trim();
  if (!empName || !compName) {
    showAlert('Required Fields', 'Both Employee Name and Company Name fields are required to proceed.');
    return;
  }
  setupComplete = true;
  const bar = document.getElementById('emp-bar');
  document.getElementById('emp-bar-txt').textContent = empName + ' · ' + compName;
  bar.style.display = 'flex';
  document.getElementById('nl-order').disabled = false;
  document.getElementById('nl-dash').disabled = false;
  showToast('✓ Profile saved!');
  setTimeout(() => goTo('order'), 700);
}

// ============================================================
// PRODUCT TABLE & ORDER LOGIC
// ============================================================
function addProduct() {
  const name = document.getElementById('np').value.trim();
  const qty = parseInt(document.getElementById('nq').value) || 1;
  const price = parseFloat(document.getElementById('npr').value) || 0;
  if (!name) {
    showAlert('Missing Parameter', 'Please fill in the Product Name field before adding.');
    return;
  }
  if (price <= 0) {
    showAlert('Invalid Price', 'The product price must be a valid number greater than 0.');
    return;
  }
  const code = 'P-' + String(pid + 1).padStart(3, '0');
  products.push({ id: pid++, name, qty, price, code });
  document.getElementById('np').value = '';
  document.getElementById('nq').value = '1';
  document.getElementById('npr').value = '';
  renderTable();
}

function removeProduct(id) { 
  products = products.filter(p => p.id !== id);
  renderTable(); 
}

function updateField(id, f, v) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  if (f === 'q') p.qty = Math.max(1, parseInt(v) || 1);
  else if (f === 'p') p.price = Math.max(0, parseFloat(v) || 0);
  else if (f === 'n') p.name = v.trim() || 'Untitled';
  renderTable();
}

function renderTable() {
  const tb = document.getElementById('ptbody');
  if (!products.length) { 
    tb.innerHTML = '<tr class="empty-r"><td colspan="6">No products added yet</td></tr>';
    updateTotals(); 
    return; 
  }
  let sub = 0;
  tb.innerHTML = products.map(p => {
    const s = p.qty * p.price;
    sub += s;
    return `<tr>
      <td class="cn"><input class="iinput" type="text" value="${esc(p.name)}" onchange="updateField(${p.id},'n',this.value)" style="width:100%;"></td>
      <td class="cc" style="font-size:12px;color:var(--muted);">${p.code}</td>
      <td class="cq"><input class="iinput" type="number" min="1" value="${p.qty}" style="width:46px;" onchange="updateField(${p.id},'q',this.value)"></td>
      <td class="cp"><input class="iinput" type="number" min="0" step="0.01" value="${p.price.toFixed(2)}" style="width:62px;" onchange="updateField(${p.id},'p',this.value)"></td>
      <td class="cs">$${s.toFixed(2)}</td>
      <td class="cd"><button class="del-btn" onclick="removeProduct(${p.id})" aria-label="Remove">❌ Remove</button></td>
    </tr>`;
  }).join('');
  updateTotals();
}

function updateTotals() {
  const net = products.reduce((s, p) => s + p.qty * p.price, 0);
  const discountAmount = net * discountPercent;
  const discountedNet = net - discountAmount;
  const shipping = parseFloat(document.getElementById('shipping-cost').value) || 0;
  const taxable = discountedNet + shipping;
  const tax = taxable * 0.13;
  const gross = taxable + tax;

  document.getElementById('t-net').textContent = '$' + net.toFixed(2);
  document.getElementById('t-tax').textContent = '$' + tax.toFixed(2);
  document.getElementById('t-gross').textContent = '$' + gross.toFixed(2);

  const discountLine = document.getElementById('discount-line');
  const discountLabel = document.getElementById('discount-label');
  const discountAmountSpan = document.getElementById('discount-amount');
  if (discountPercent > 0 && net > 0) {
    discountLine.style.display = 'flex';
    discountLabel.textContent = (discountPercent * 100).toFixed(0) + '%';
    discountAmountSpan.textContent = '-$' + discountAmount.toFixed(2);
  } else {
    discountLine.style.display = 'none';
  }

  const shippingLine = document.getElementById('shipping-line');
  const shippingAmountSpan = document.getElementById('shipping-amount');
  shippingLine.style.display = 'flex';
  shippingAmountSpan.textContent = '$' + shipping.toFixed(2);
}

function applyDiscount() {
  const input = document.getElementById('discount-input');
  const code = input.value.trim().toUpperCase();
  if (!code) {
    showAlert('Empty Code', 'Please enter a discount code.');
    return;
  }
  if (appliedDiscountCode === code) {
    showAlert('Already Applied', 'This discount code is already active.');
    return;
  }
  const percent = DISCOUNT_CODES[code];
  if (percent === undefined) {
    showAlert('Invalid Code', 'The discount code entered is not valid. Try: PLEASE, SAVE10, DISCOUNT15');
    return;
  }
  appliedDiscountCode = code;
  discountPercent = percent;
  document.getElementById('discount-status').textContent = '✅ ' + code + ' (' + (percent * 100).toFixed(0) + '%)';
  document.getElementById('discount-input').value = '';
  updateTotals();
  showToast('🎉 Discount applied: ' + code);
}

function removeDiscount() {
  appliedDiscountCode = null;
  discountPercent = 0;
  document.getElementById('discount-status').textContent = '';
  document.getElementById('discount-input').value = '';
  updateTotals();
  showToast('✕ Discount removed');
}

function generateOrder() {
  if (!empName) {
    showAlert('Profile Setup Required', 'Complete your system setup profile before generating orders.');
    return;
  }
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const addr = document.getElementById('c-addr').value.trim();

  if (!name || !email || !phone || !addr) {
    showAlert('Incomplete Information', 'All customer parameters (Name, Email, Phone, and Address) must be filled out to continue.');
    return;
  }

  const allowedDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'live.com'];
  const emailParts = email.split('@');

  if (emailParts.length !== 2 || !allowedDomains.includes(emailParts[1].toLowerCase())) {
    showAlert('Invalid Email Domain', 'The email address must include a valid format with an "@" character followed by a recognized domain provider (e.g., gmail.com, hotmail.com, yahoo.com).');
    return;
  }

  if (!products.length) {
    showAlert('Empty Product List', 'You must add at least one item to the products summary table to generate a new transaction.');
    return;
  }

  const paymentMethod = document.getElementById('payment-method').value;
  let payment = { method: paymentMethod };
  if (paymentMethod === 'cash') {
    const cashAmount = parseFloat(document.getElementById('cash-amount').value) || 0;
    if (cashAmount <= 0) { 
      showAlert('Missing Cash Amount', 'Please enter a valid cash amount greater than 0.'); 
      return; 
    }
    payment.cashAmount = cashAmount;
  } else {
    const cardNumber = document.getElementById('card-number').value.trim();
    if (!cardNumber) { 
      showAlert('Missing Card Number', 'Please enter the credit card number to continue.'); 
      return; 
    }
    payment.cardNumber = cardNumber;
  }

  const net = products.reduce((s, p) => s + p.qty * p.price, 0);
  const discountAmount = net * discountPercent;
  const discountedNet = net - discountAmount;
  const shippingCost = parseFloat(document.getElementById('shipping-cost').value) || 0;
  const taxable = discountedNet + shippingCost;
  const tax = taxable * 0.13;
  const gross = taxable + tax;

  const now = new Date();
  const oid = 'ORD-' + String(orders.length + 1).padStart(3, '0');
  orders.push({
    id: oid,
    customer: { name, email, phone, addr },
    employee: empName,
    company: compName,
    products: [...products],
    net,
    tax,
    gross,
    status: 'pending',
    payment,
    discountCode: appliedDiscountCode || null,
    discountPercent: discountPercent || 0,
    discountAmount: discountAmount || 0,
    shippingCost: shippingCost || 0,
    date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  });
  products = [];
  pid = 0;
  ['c-name', 'c-email', 'c-phone', 'c-addr', 'cash-amount', 'card-number'].forEach(x => document.getElementById(x).value = '');
  document.getElementById('payment-method').value = 'cash';
  togglePaymentFields();
  removeDiscount();
  document.getElementById('shipping-cost').value = 0;
  renderTable();
  showToast('✓ ' + oid + ' created!');
  triggerMoneyRain();
  setTimeout(() => goTo('dash'), 800);
}

function finishOrder(oid) {
  const o = orders.find(x => x.id === oid);
  if (!o) return;
  if (o.status === 'finished') {
    showAlert('Already Finished', 'This transaction has already been completed and processed.');
    return;
  }
  o.status = 'finished';
  showToast('✓ Order marked as Finished');
  renderDash();
}

function deleteOrder(oid) {
  orders = orders.filter(x => x.id !== oid);
  showToast('✕ Order deleted successfully');
  renderDash();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDash() {
  const rev = orders.reduce((s, o) => s + o.net, 0);
  const tot = orders.reduce((s, o) => s + o.gross, 0);
  
  const countEl = document.getElementById('m-count');
  const revEl = document.getElementById('m-rev');
  const totalEl = document.getElementById('m-total');
  
  const objCount = { val: 0 };
  const objRev = { val: 0 };
  const objTotal = { val: 0 };

  gsap.to(objCount, { 
    val: orders.length, 
    duration: 1.2, 
    ease: "power2.out",
    onUpdate: () => { countEl.innerHTML = Math.round(objCount.val); }
  });
  
  gsap.to(objRev, { 
    val: rev, 
    duration: 1.2, 
    ease: "power2.out",
    onUpdate: () => { revEl.innerHTML = '$' + objRev.val.toFixed(2); }
  });
  
  gsap.to(objTotal, { 
    val: tot, 
    duration: 1.2, 
    ease: "power2.out",
    onUpdate: () => { totalEl.innerHTML = '$' + objTotal.val.toFixed(2); }
  });

  const g = document.getElementById('orders-grid');

  if (!orders.length) {
    g.innerHTML = `
      <div class="no-orders">
        <div class="wild-west-container" id="west-stage">
          <div class="desert-cactus cactus-1">🌵</div>
          <div class="desert-cactus cactus-2">🌵</div>
          <div class="desert-cactus cactus-3">🌵</div>
          <div class="tumbleweed" id="weed1"></div>
          <div class="tumbleweed" id="weed2"></div>
          <div class="desert-sand"></div>
        </div>
        <div class="west-text">"I don't see the green ones over here"</div>
      </div>
    `;
    initTumbleweeds();
    return;
  }

  g.innerHTML = orders.slice().reverse().map(o => {
    const discountInfo = (o.discountCode && o.discountPercent > 0) ?
      'Discount: ' + o.discountCode + ' (' + (o.discountPercent * 100).toFixed(0) + '%) -$' + o.discountAmount.toFixed(2) :
      '';
    return `
    <div class="ocard">
      <div class="ocard-top">
        <div><div class="o-id">${o.id} · ${o.date}</div><div class="o-name">${esc(o.customer.name)}</div></div>
        <span class="st-pill st-${o.status}">${o.status}</span>
      </div>
      <div class="o-meta">
        <span><i class="ti ti-mail" aria-hidden="true"></i>${esc(o.customer.email)}</span>
        <span><i class="ti ti-phone" aria-hidden="true"></i>${esc(o.customer.phone)}</span>
        <span><i class="ti ti-map-pin" aria-hidden="true"></i>${esc(o.customer.addr)}</span>
        <span><i class="ti ti-credit-card" aria-hidden="true"></i>${o.payment.method === 'cash' ? 'Cash · $' + o.payment.cashAmount.toFixed(2) : 'Card · •••• ' + String(o.payment.cardNumber).slice(-4)}</span>
        ${discountInfo ? `<span><i class="ti ti-tag" aria-hidden="true"></i>${discountInfo}</span>` : ''}
        ${o.shippingCost > 0 ? `<span><i class="ti ti-truck" aria-hidden="true"></i>Shipping: $${o.shippingCost.toFixed(2)}</span>` : ''}
      </div>
      <div class="o-chips">${o.products.map(p => `<span class="o-chip">${esc(p.name)} ×${p.qty}</span>`).join('')}</div>
      <div class="o-footer">
        <div class="o-total">$${o.gross.toFixed(2)}<small>incl. 13% tax</small></div>
        <div class="o-actions">
          <button class="action-btn btn-finish" onclick="finishOrder('${o.id}')" title="Order Finished"><i class="ti ti-circle-check"></i> ✅ Finished</button>
          <button class="action-btn btn-delete" onclick="deleteOrder('${o.id}')" title="Delete Order"><i class="ti ti-trash"></i> 🗑️ Delete</button>
          <button class="pdf-btn" onclick="exportPDF('${o.id}')"><i class="ti ti-file-type-pdf" aria-hidden="true"></i> 📄 PDF</button>
        </div>
      </div>
    </div>
  `}).join('');
}

function exportPDF(oid) {
  const o = orders.find(x => x.id === oid);
  if (!o) return;

  const rows = o.products.map(p => `
    <tr>
      <td style="font-weight:500;color:#1e293b;">${esc(p.name)} <span style="color:#94a3b8;font-size:11px;">(${p.code})</span></td>
      <td style="text-align:center;color:#475569;">${p.qty}</td>
      <td style="text-align:right;color:#475569;">$${p.price.toFixed(2)}</td>
      <td style="text-align:right;font-weight:600;color:#0f172a;">$${(p.qty * p.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const discountRow = (o.discountCode && o.discountPercent > 0) ? `
    <tr>
      <td colspan="3" style="text-align:right;font-weight:500;color:#e05580;">Discount (${o.discountCode} - ${(o.discountPercent * 100).toFixed(0)}%)</td>
      <td style="text-align:right;font-weight:600;color:#e05580;">-$${o.discountAmount.toFixed(2)}</td>
    </tr>
  ` : '';

  const shippingRow = (o.shippingCost > 0) ? `
    <tr>
      <td colspan="3" style="text-align:right;font-weight:500;color:#1a6fd4;">Shipping cost</td>
      <td style="text-align:right;font-weight:600;color:#1a6fd4;">$${o.shippingCost.toFixed(2)}</td>
    </tr>
  ` : '';

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Invoice ${o.id}</title>
    <style>
      @page { size: A4; margin: 0; }
      *, *::before, *::after { box-sizing: border-box; }
      .page-wrapper { padding: 28mm 24mm; width:100%; min-height:100vh; background:#ffffff; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin:0; padding:0; color:#1e293b; font-size:13px; line-height:1.5; }
      .header-table { width:100%; border-collapse:collapse; margin-bottom:35px; }
      .brand-title { font-size:28px; font-weight:800; color:#1a6fd4; letter-spacing:-0.5px; margin:0; }
      .brand-subtitle { font-size:12px; color:#64748b; margin-top:4px; }
      .invoice-title { font-size:20px; font-weight:700; color:#0f172a; text-align:right; margin:0; letter-spacing:0.5px; }
      .invoice-id { font-size:14px; font-weight:700; color:#e05580; text-align:right; margin-top:4px; }
      .info-table { width:100%; border-collapse:collapse; margin-bottom:40px; }
      .info-cell { width:50%; vertical-align:top; }
      .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:18px 20px; margin-right:12px; }
      .info-box.right { margin-right:0; margin-left:12px; }
      .sec-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#1a6fd4; margin:0 0 12px 0; border-bottom:1px solid #e2e8f0; padding-bottom:6px; }
      .info-row { margin-bottom:6px; font-size:13px; }
      .info-lbl { color:#64748b; font-weight:500; display:inline-block; width:85px; }
      .info-val { color:#1e293b; font-weight:600; }
      .items-table { width:100%; border-collapse:collapse; margin-bottom:30px; }
      .items-table th { background:#0f172a; color:#ffffff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; padding:12px 14px; text-align:left; }
      .items-table th:first-child { border-top-left-radius:6px; border-bottom-left-radius:6px; }
      .items-table th:last-child { border-top-right-radius:6px; border-bottom-right-radius:6px; text-align:right; }
      .items-table td { padding:12px 14px; border-bottom:1px solid #e2e8f0; vertical-align:middle; }
      .summary-table { width:260px; margin-left:auto; border-collapse:collapse; margin-top:20px; }
      .summary-table td { padding:6px 10px; font-size:13px; color:#475569; }
      .summary-table .lbl { text-align:right; font-weight:500; }
      .summary-table .val { text-align:right; font-weight:600; width:110px; color:#1e293b; }
      .summary-table tr.total-row td { font-size:16px; font-weight:700; color:#1a6fd4; border-top:2px solid #1a6fd4; padding-top:10px; }
      .summary-table tr.discount-row td { color:#e05580; font-weight:500; }
      .summary-table tr.shipping-row td { color:#1a6fd4; font-weight:500; }
      .footer { border-top:1px solid #e2e8f0; padding-top:15px; margin-top:60px; text-align:center; font-size:11px; color:#94a3b8; font-weight:500; }
    </style>
  </head>
  <body>
    <div class="page-wrapper">
      <table class="header-table">
        <tr>
          <td>
            <div class="brand-title">OrderFlow</div>
            <div class="brand-subtitle">Company: <strong>${esc(o.company)}</strong> &middot; Agent: <strong>${esc(o.employee)}</strong></div>
          </td>
          <td style="vertical-align:top;">
            <div class="invoice-title">PURCHASE INVOICE</div>
            <div class="invoice-id">${o.id}</div>
          </td>
        </tr>
      </table>

      <table class="info-table">
        <tr>
          <td class="info-cell">
            <div class="info-box">
              <h2 class="sec-title">Order Details</h2>
              <div class="info-row"><span class="info-lbl">Date:</span><span class="info-val">${o.date}</span></div>
              <div class="info-row"><span class="info-lbl">Status:</span><span class="info-val" style="color:#166534;text-transform:capitalize;">${o.status}</span></div>
              <div class="info-row"><span class="info-lbl">Payment:</span><span class="info-val">${o.payment.method === 'cash' ? 'Cash' : 'Card'}</span></div>
              <div class="info-row"><span class="info-lbl">Reference:</span><span class="info-val">${o.payment.method === 'cash' ? '$' + o.payment.cashAmount.toFixed(2) : '•••• ' + String(o.payment.cardNumber).slice(-4)}</span></div>
              ${o.discountCode ? `<div class="info-row"><span class="info-lbl">Discount:</span><span class="info-val" style="color:#e05580;">${o.discountCode} (${(o.discountPercent * 100).toFixed(0)}%) -$${o.discountAmount.toFixed(2)}</span></div>` : ''}
              ${o.shippingCost > 0 ? `<div class="info-row"><span class="info-lbl">Shipping:</span><span class="info-val" style="color:#1a6fd4;">$${o.shippingCost.toFixed(2)}</span></div>` : ''}
            </div>
          </td>
          <td class="info-cell">
            <div class="info-box right">
              <h2 class="sec-title">Customer Information</h2>
              <div class="info-row"><span class="info-lbl">Name:</span><span class="info-val">${esc(o.customer.name)}</span></div>
              <div class="info-row"><span class="info-lbl">Phone:</span><span class="info-val">${esc(o.customer.phone)}</span></div>
              <div class="info-row"><span class="info-lbl">Email:</span><span class="info-val" style="font-weight:500;">${esc(o.customer.email)}</span></div>
              <div class="info-row"><span class="info-lbl">Address:</span><span class="info-val">${esc(o.customer.addr)}</span></div>
            </div>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width:40%;">Description</th>
            <th style="width:15%;text-align:center;">Qty</th>
            <th style="width:20%;text-align:right;">Unit Price</th>
            <th style="width:25%;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <table class="summary-table">
        <tr><td class="lbl">Net subtotal</td><td class="val">$${o.net.toFixed(2)}</td></tr>
        ${discountRow}
        ${shippingRow}
        <tr><td class="lbl">Tax (13%)</td><td class="val">$${o.tax.toFixed(2)}</td></tr>
        <tr class="total-row"><td class="lbl">Total to pay</td><td class="val">$${o.gross.toFixed(2)}</td></tr>
      </table>

      <div class="footer">
        Electronic document issued by OrderFlow &middot; Thank you for your trust!
      </div>
    </div>
  </body>
  </html>`;

  const w = window.open('', '_blank', 'width=850,height=700');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 350);
  } else {
    showAlert('Browser Blocked Popup', 'Please allow popups for this page to export and print the order PDF invoice document.');
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  gsap.killTweensOf(t);
  t.classList.add('show');
  gsap.fromTo(t, { y: 50, opacity: 0, scale: 0.8 }, { duration: 0.4, y: 0, opacity: 1, scale: 1, ease: "back.out(1.5)" });
  gsap.to(t, { delay: 2.5, duration: 0.3, opacity: 0, y: 20, scale: 0.95, onComplete: () => t.classList.remove('show') });
}

function esc(s) { 
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;'); 
}

function goTo(p) {
  if ((p === 'order' || p === 'dash') && !setupComplete) {
    showAlert('Navigation Restricted', 'Please complete the profile Setup first before exploring other sections.');
    return;
  }
  ['setup', 'order', 'dash'].forEach(x => {
    document.getElementById('pg-' + x).classList.remove('active');
    document.getElementById('nl-' + x).classList.remove('active');
  });
  const nextPage = document.getElementById('pg-' + p);
  nextPage.classList.add('active');
  document.getElementById('nl-' + p).classList.add('active');
  gsap.fromTo(nextPage, { opacity: 0, x: 15 }, { duration: 0.4, opacity: 1, x: 0, ease: "power2.out" });
  gsap.from(nextPage.querySelectorAll('.field, .card, .mcard'), {
    duration: 0.4,
    y: 15,
    opacity: 0,
    stagger: 0.05,
    ease: "power3.out",
    clearProps: "all"
  });
  if (p === 'dash') renderDash();
}

function initTumbleweeds() {
  const stage = document.getElementById('west-stage');
  const w1 = document.getElementById('weed1');
  const w2 = document.getElementById('weed2');
  if (!stage || !w1 || !w2) return;
  const stageW = stage.clientWidth;
  let pos1 = { x: stageW * 0.15, y: 0, vx: 1.1, size: 35 };
  let pos2 = { x: stageW * 0.75, y: 0, vx: -0.9, size: 35 };
  gsap.ticker.remove(updateLoop);

  function updateLoop() {
    if (!document.getElementById('west-stage')) { gsap.ticker.remove(updateLoop); return; }
    const currentWidth = stage.clientWidth;
    pos1.x += pos1.vx;
    pos2.x += pos2.vx;
    pos1.y = Math.abs(Math.sin(pos1.x * 0.025)) * 16;
    pos2.y = Math.abs(Math.sin(pos2.x * 0.022)) * 14;
    if (pos1.x <= 0) { 
      pos1.x = 0;
      pos1.vx *= -1; 
    }
    if (pos1.x >= currentWidth - pos1.size) { 
      pos1.x = currentWidth - pos1.size;
      pos1.vx *= -1; 
    }
    if (pos2.x <= 0) { 
      pos2.x = 0;
      pos2.vx *= -1; 
    }
    if (pos2.x >= currentWidth - pos2.size) { 
      pos2.x = currentWidth - pos2.size;
      pos2.vx *= -1; 
    }
    let dist = Math.abs(pos1.x - pos2.x);
    if (dist < pos1.size) {
      let temp = pos1.vx;
      pos1.vx = pos2.vx;
      pos2.vx = temp;
      if (pos1.x < pos2.x) { 
        pos1.x -= 1;
        pos2.x += 1; 
      } else { 
        pos1.x += 1;
        pos2.x -= 1; 
      }
    }
    gsap.set(w1, { x: pos1.x, y: -pos1.y, rotation: pos1.x * 1.5 });
    gsap.set(w2, { x: pos2.x, y: -pos2.y, rotation: pos2.x * -1.5 });
  }
  gsap.ticker.add(updateLoop);
}

function triggerMoneyRain() {
  const rainContainer = document.createElement('div');
  rainContainer.className = 'money-rain-container';
  document.body.appendChild(rainContainer);
  const emojis = ['💰', '💵', '💸', '🤑', '🪙'];
  const count = 45;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'money-emoji';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const randomX = Math.random() * 100;
    el.style.left = randomX + 'vw';
    el.style.top = '-50px';
    rainContainer.appendChild(el);
    const duration = gsap.utils.random(2.0, 3.8);
    const delay = gsap.utils.random(0, 0.6);
    const rotation = gsap.utils.random(-360, 360);
    const driftX = gsap.utils.random(-80, 80);
    gsap.to(el, { y: window.innerHeight + 100, x: driftX, rotation: rotation, duration: duration, delay: delay, ease: "power1.in" });
    gsap.to(el, { opacity: 0, duration: duration * 0.4, delay: delay + (duration * 0.6), ease: "power1.out" });
  }
  setTimeout(() => { rainContainer.remove(); }, 4500);
}

// ============================================================
// INITIAL ANIMATIONS
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  gsap.from(".setup-hero", { duration: 1, y: 30, opacity: 0, ease: "power3.out" });
  gsap.from(".pg-setup .card", { duration: 1, y: 50, opacity: 0, delay: 0.2, ease: "power3.out" });
  gsap.to(".setup-icon i", { y: -6, duration: 1.8, repeat: -1, yoyo: true, ease: "power1.inOut" });
  gsap.to(".nav-brand i", { scale: 1.1, duration: 2, repeat: -1, yoyo: true, ease: "power1.inOut" });
  gsap.to(".primary-btn", { boxShadow: "0 6px 20px rgba(26,111,212,0.4)", duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.from(".navbar", { y: -20, opacity: 0, duration: 0.8, ease: "power2.out" });
});

togglePaymentFields();

// ============================================================
// CHATBOT GRATUITO
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  const chatToggle = document.getElementById('chat-toggle');
  const chatPanel = document.getElementById('chat-panel');
  const chatClose = document.getElementById('chat-close');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const messagesContainer = document.getElementById('chat-messages');

  if (!chatToggle || !chatPanel || !chatClose || !chatInput || !chatSend || !messagesContainer) {
    return;
  }

  // Toggle chat con GSAP
  function toggleChat() {
    const isOpen = chatPanel.classList.contains('open');
    if (isOpen) {
      gsap.to(chatPanel, {
        scale: 0.8,
        y: 30,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          chatPanel.classList.remove('open');
          chatPanel.style.display = 'none';
        }
      });
      gsap.to(chatToggle, { scale: 1, duration: 0.2 });
    } else {
      chatPanel.style.display = 'flex';
      gsap.fromTo(chatPanel,
        { scale: 0.7, y: 40, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
      );
      chatPanel.classList.add('open');
      gsap.to(chatToggle, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });
      setTimeout(() => chatInput.focus(), 300);
    }
  }

  chatToggle.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', toggleChat);

  // Enviar mensaje
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';
    handleBotResponse(text);
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = sender === 'bot' ? 'bot-msg' : 'user-msg';
    div.textContent = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // ============================================================
  // CHATBOT ULTRA RÁPIDO (Vía Backend Server)
  // ============================================================
  async function handleBotResponse(userText) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-msg';
    typingDiv.textContent = '✍️ Thinking...';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userText })
      });

      const data = await response.json();
      typingDiv.remove();

      if (response.ok && data.answer) {
        await typeMessage(data.answer, 'bot');
      } else {
        console.error('Error del servidor:', data);
        await typeMessage(data.error || 'Lo siento, el modelo tuvo un inconveniente.', 'bot');
      }
    } catch (error) {
      console.error('Error de red/conexión:', error);
      typingDiv.remove();
      await typeMessage('⚠️ Error conectando con el servidor. Asegúrate de ejecutar server.js.', 'bot');
    }
  }

  // Efecto de escritura
  function typeMessage(text, sender) {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      div.className = sender === 'bot' ? 'bot-msg' : 'user-msg';
      div.textContent = '';
      messagesContainer.appendChild(div);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      let index = 0;
      const chars = text.split('');
      const total = chars.length;
      const speed = 15;

      function addNextChar() {
        if (index < total) {
          div.textContent += chars[index];
          index++;
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          gsap.delayedCall(speed / 1000, addNextChar);
        } else {
          resolve();
        }
      }
      addNextChar();
    });
  }
});