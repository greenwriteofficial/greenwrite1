/* assets/js/script.js
   Full script (replace existing file)
   - India base shipping set to ₹40
   - Adjusted international rates
   - Free shipping above ₹500
   - Live shipping calculator UI (weight, tier, ETA)
   - Mobile-safe WhatsApp opening (uses whatsapp:// then api.whatsapp.com fallback)
   - Sticky header, mobile menu, dark mode
   - Hero & product slideshows, lightbox
   - Order preview, save draft, WhatsApp send, success modal
*/

/* Utilities */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const safe = fn => { try { return fn(); } catch(e){ console.warn(e); } };

/* ================= HEADER, MENU, DARKMODE ================= */
(function headerAndUI(){
  const header = document.querySelector('.site-header') || document.querySelector('header');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('shrink');
    else header.classList.remove('shrink');
  }, { passive: true });

  if (menuBtn && mobileMenu){
    const openMenu = () => { mobileMenu.classList.add('open'); menuBtn.classList.add('open'); menuBtn.setAttribute('aria-expanded','true'); document.body.classList.add('lock'); mobileMenu.setAttribute('aria-hidden','false'); };
    const closeMenu = () => { mobileMenu.classList.remove('open'); menuBtn.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); document.body.classList.remove('lock'); mobileMenu.setAttribute('aria-hidden','true'); };
    menuBtn.addEventListener('click', () => mobileMenu.classList.contains('open') ? closeMenu() : openMenu());
    $$('.mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    function updateNav(){
      const mainNav = document.querySelector('.main-nav');
      if (!mainNav) return;
      if (window.innerWidth <= 980){ mainNav.style.display = 'none'; if (menuBtn) menuBtn.style.display = 'flex'; }
      else { mainNav.style.display = 'flex'; if (menuBtn) menuBtn.style.display = 'none'; closeMenu(); }
    }
    updateNav();
    window.addEventListener('resize', updateNav);
  }

  // Dark toggle (persist)
  const DARK_KEY = 'greenwrite_dark_v1';
  const darkToggle = document.getElementById('darkToggle');
  const mobileDarkToggle = document.getElementById('mobileDarkToggle');
  function setDark(on){
    if (on) document.body.classList.add('dark'); else document.body.classList.remove('dark');
    try { localStorage.setItem(DARK_KEY, on ? '1' : '0'); } catch(e){}
  }
  (function initDark(){
    const stored = localStorage.getItem(DARK_KEY);
    if (stored === null){
      const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefers);
    } else setDark(stored === '1');
  })();
  if (darkToggle) darkToggle.addEventListener('click', () => setDark(!document.body.classList.contains('dark')));
  if (mobileDarkToggle) mobileDarkToggle.addEventListener('click', () => setDark(!document.body.classList.contains('dark')));
})();

/* ================= TYPED HEADLINE + HERO PARALLAX ================= */
(function typedAndParallax(){
  const typedEl = document.getElementById('typedText') || document.getElementById('typedTextSmall');
  const words = ["Write your future.", "Grow your planet."];
  if (typedEl){
    let wI=0, cI=0;
    (function loop(){
      const w = words[wI];
      typedEl.textContent = w.slice(0, cI);
      cI++;
      if (cI > w.length + 8){ cI = 0; wI = (wI+1)%words.length; setTimeout(loop, 700); }
      else setTimeout(loop, 60);
    })();
  }
  const heroWrap = document.getElementById('heroWrap');
  const heroBg = document.getElementById('heroBg');
  if (heroWrap && heroBg){
    heroWrap.addEventListener('mousemove', e => {
      const rect = heroWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left)/rect.width - 0.5;
      const y = (e.clientY - rect.top)/rect.height - 0.5;
      heroBg.style.transform = `translate(${x*18}px, ${y*12}px) rotate(${x*2}deg)`;
    });
  }
})();

/* ================= REVEAL / COUNTERS ================= */
(function revealAndCounters(){
  const elems = document.querySelectorAll('.fade-in, .reveal-list');
  const obs = new IntersectionObserver((entries, ob) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('show'); ob.unobserve(en.target); } });
  }, { threshold: 0.12 });
  elems.forEach(e => obs.observe(e));

  const stats = document.querySelector('.stats');
  if (stats){
    const cobs = new IntersectionObserver((entries, ob) => {
      entries.forEach(ent => {
        if (ent.isIntersecting){
          $$('.num').forEach(el => {
            const target = +el.getAttribute('data-target') || 0;
            let current = 0;
            const step = Math.max(1, Math.floor(target/80));
            const t = setInterval(() => {
              current += step;
              if (current >= target){ el.textContent = target; clearInterval(t); }
              else el.textContent = current;
            }, 18);
          });
          ob.disconnect();
        }
      });
    }, { threshold: 0.2 });
    cobs.observe(stats);
  }
})();

/* ================= SLIDESHOWS ================= */
function startSlideshow(containerId, interval = 3600){
  safe(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const slides = Array.from(container.querySelectorAll('.slide'));
    if (!slides.length) return;
    const prev = container.querySelector('.slide-prev');
    const next = container.querySelector('.slide-next');
    let idx = 0;
    function show(i){ slides.forEach(s => s.classList.remove('active')); slides[i].classList.add('active'); }
    show(idx);
    let timer = setInterval(() => { idx = (idx+1)%slides.length; show(idx); }, interval);
    container.addEventListener('mouseenter', () => clearInterval(timer));
    container.addEventListener('mouseleave', () => { timer = setInterval(()=>{ idx=(idx+1)%slides.length; show(idx); }, interval); });
    prev && prev.addEventListener('click', ()=>{ idx=(idx-1+slides.length)%slides.length; show(idx); });
    next && next.addEventListener('click', ()=>{ idx=(idx+1)%slides.length; show(idx); });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  startSlideshow('heroSlideshow', 3500);
  startSlideshow('prodSlideshow', 3500);
});

/* ================= LIGHTBOX ================= */
(function lightboxInit(){
  const lb = document.getElementById('lightbox');
  const lbimg = document.getElementById('lbimg') || document.getElementById('lightbox-img');
  if (!lb || !lbimg) return;
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.img || (btn.closest('.prod') && btn.closest('.prod').querySelector('img') && btn.closest('.prod').querySelector('img').src) || '';
      if (src) lbimg.src = src;
      lb.classList.add('show'); lb.setAttribute('aria-hidden','false');
    });
  });
  $$('.gallery-grid img').forEach(img => img.addEventListener('click', e => { lbimg.src = e.target.src; lb.classList.add('show'); lb.setAttribute('aria-hidden','false'); }));
  lb.addEventListener('click', e => { if (e.target === lb) { lb.classList.remove('show'); lb.setAttribute('aria-hidden','true'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('show'); });
})();

/* ================= BACK TO TOP ================= */
(function backToTop(){
  const top = document.getElementById('topBtn');
  if (!top) return;
  window.addEventListener('scroll', () => { if (window.scrollY > 450) top.classList.add('show'); else top.classList.remove('show'); }, { passive: true });
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ================= SHIPPING RATES & ETA SETTINGS ================= */
/* Free shipping threshold and packaging */
const FREE_SHIPPING_MIN_ORDER = 500; // ₹500 -> free shipping threshold
const BULK_FREE_QTY = 50;
const packagingWeightG = 30; // packaging grams

/* Shipping rates: India base = ₹40 (first tier) */
const shippingRates = {
  "IN":[ {maxKg:0.25,cost:40},{maxKg:0.5,cost:70},{maxKg:1.0,cost:110},{maxKg:2.0,cost:180},{maxKg:5.0,cost:320} ],
  "US":[ {maxKg:0.25,cost:600},{maxKg:0.5,cost:900},{maxKg:1.0,cost:1300},{maxKg:2.0,cost:2200},{maxKg:5.0,cost:3600} ],
  "UK":[ {maxKg:0.25,cost:550},{maxKg:0.5,cost:820},{maxKg:1.0,cost:1250},{maxKg:2.0,cost:2100},{maxKg:5.0,cost:3400} ],
  "AU":[ {maxKg:0.25,cost:650},{maxKg:0.5,cost:1000},{maxKg:1.0,cost:1500},{maxKg:2.0,cost:2600},{maxKg:5.0,cost:3900} ],
  "OTHER":[ {maxKg:0.25,cost:900},{maxKg:0.5,cost:1300},{maxKg:1.0,cost:2000},{maxKg:2.0,cost:3400},{maxKg:5.0,cost:5600} ]
};

/* ETA rules (simple): returns string of estimated delivery days */
function estimateETA(countryCode, weightKg){
  countryCode = (countryCode || 'IN').toUpperCase();
  if (countryCode === 'IN'){
    if (weightKg <= 0.5) return '3-5 business days';
    if (weightKg <= 1) return '5-7 business days';
    if (weightKg <= 2) return '7-10 business days';
    return '10-14 business days';
  }
  // International
  if (countryCode === 'US' || countryCode === 'UK' || countryCode === 'AU'){
    if (weightKg <= 0.5) return '7-12 business days';
    if (weightKg <= 1) return '10-15 business days';
    if (weightKg <= 2) return '12-20 business days';
    return '18-30 business days';
  }
  // OTHER
  if (weightKg <= 0.5) return '10-18 business days';
  if (weightKg <= 1) return '12-22 business days';
  return '20-35 business days';
}

/* ================= SHIPPING CALCULATOR PANEL (auto-insert) ================= */
function ensureShippingPanel(){
  const summary = document.querySelector('.summary-box') || (document.querySelector('.order-form') && document.querySelector('.order-form'));
  if (!summary) return null;
  let panel = document.getElementById('shipCalcPanel');
  if (!panel){
    panel = document.createElement('div');
    panel.id = 'shipCalcPanel';
    panel.style.marginTop = '10px';
    panel.style.padding = '10px';
    panel.style.borderRadius = '8px';
    panel.style.background = 'rgba(255,255,255,0.92)';
    panel.style.border = '1px solid rgba(0,0,0,0.04)';
    panel.className = 'ship-calc';
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:700">Shipping estimate</div>
        <div id="shipETA" class="small" style="color:var(--muted)">—</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <div class="small">Estimated weight</div><div id="estWeight" class="small">—</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <div class="small">Shipping tier</div><div id="shipTier" class="small">—</div>
      </div>
    `;
    summary.parentNode.insertBefore(panel, summary.nextSibling);
  }
  return panel;
}

/* ================= ORDER FORM: totals, shipping, preview, save, submit ================= */
(function orderSystem(){
  const productSelect = document.getElementById('productSelect');
  const qtyInput = document.getElementById('qty');
  const countrySelect = document.getElementById('country');
  const itemsTotalEl = document.getElementById('itemsTotal');
  const shipCostEl = document.getElementById('shipCost');
  const grandTotalEl = document.getElementById('grandTotal');
  const previewBtn = document.getElementById('previewBtn');
  const orderForm = document.getElementById('orderForm');
  const orderModal = document.getElementById('orderModal');
  const orderDetails = document.getElementById('orderDetails');
  const closeModal = document.getElementById('closeModal');
  const confirmOrder = document.getElementById('confirmOrder');
  const editOrder = document.getElementById('editOrder');
  const saveLocalBtn = document.getElementById('saveLocal');
  const successModal = document.getElementById('successModal');
  const closeSuccess = document.getElementById('closeSuccess');
  const paymentArea = document.getElementById('paymentArea');

  if (!productSelect || !qtyInput || !countrySelect || !itemsTotalEl || !shipCostEl || !grandTotalEl) return;

  // product weights map (grams)
  const productWeightMap = { "Plantable Pen":12, "Plantable Pencil":10, "Combo Pack":25 };

  function calcTotals(){
    const price = +productSelect.options[productSelect.selectedIndex].dataset.price || 0;
    const productName = productSelect.value;
    const qty = Math.max(1, Math.floor(+qtyInput.value || 1));
    const itemTotal = price * qty;

    const perItemWeightG = +productSelect.options[productSelect.selectedIndex].dataset.weight || (productWeightMap[productName] || 15);
    const totalWeightG = (perItemWeightG * qty) + packagingWeightG;
    const totalWeightKg = Math.max(0.001, totalWeightG / 1000);

    const countryCode = (countrySelect.value || "IN").toUpperCase();
    const table = shippingRates[countryCode] || shippingRates["OTHER"];
    let shipCost = table[table.length-1].cost;
    for (let i=0;i<table.length;i++){
      if (totalWeightKg <= table[i].maxKg){ shipCost = table[i].cost; break; }
    }

    // free shipping rules
    if (qty >= BULK_FREE_QTY) shipCost = 0;
    else if (itemTotal >= FREE_SHIPPING_MIN_ORDER) shipCost = 0;

    // update UI elements
    itemsTotalEl.textContent = `₹${itemTotal}`;
    shipCostEl.textContent = `₹${shipCost}`;
    grandTotalEl.textContent = `₹${itemTotal + shipCost}`;

    // update shipping panel UI (create if needed)
    const panel = ensureShippingPanel();
    if (panel){
      const estWeight = panel.querySelector('#estWeight');
      const eta = panel.querySelector('#shipETA');
      const tier = panel.querySelector('#shipTier');
      if (estWeight) estWeight.textContent = `${(totalWeightKg).toFixed(2)} kg`;
      if (eta) eta.textContent = estimateETA(countryCode, totalWeightKg);
      // find matching tier description
      let tierText = 'Standard';
      for (let i=0;i<table.length;i++){
        if (totalWeightKg <= table[i].maxKg){ tierText = `Up to ${table[i].maxKg} kg • ₹${table[i].cost}`; break; }
      }
      // free shipping note
      if (shipCost === 0) tierText = 'Free shipping';
      if (tier) tier.textContent = tierText;
    }

    return { price, qty, itemTotal, totalWeightKg, shipCost, grand: itemTotal + shipCost, eta: estimateETA(countryCode, totalWeightKg) };
  }

  // reactive updates
  productSelect.addEventListener('change', calcTotals);
  qtyInput.addEventListener('input', calcTotals);
  countrySelect.addEventListener('change', calcTotals);
  document.addEventListener('DOMContentLoaded', calcTotals);

  // Save draft
  if (saveLocalBtn) saveLocalBtn.addEventListener('click', () => {
    const d = {
      name: (document.getElementById('name') && document.getElementById('name').value) || '',
      phone: (document.getElementById('phone') && document.getElementById('phone').value) || '',
      product: productSelect.value,
      price: productSelect.options[productSelect.selectedIndex].dataset.price,
      qty: qtyInput.value,
      country: countrySelect.value,
      email: (document.getElementById('email') && document.getElementById('email').value) || '',
      note: (document.getElementById('note') && document.getElementById('note').value) || '',
      totals: calcTotals()
    };
    try { localStorage.setItem('greenwrite_draft', JSON.stringify(d)); alert('Draft saved locally.'); } catch(e){ alert('Could not save draft.'); }
  });

  /* -----------------------
     ORDER SUBMIT / WHATSAPP
     Mobile-safe: encode once, prefer whatsapp:// then fallback to api.whatsapp.com / wa.me
     ----------------------- */
  if (orderForm) orderForm.addEventListener('submit', function(e){
    e.preventDefault();

    const nameVal = (document.getElementById('name') && document.getElementById('name').value.trim()) || '';
    const phoneVal = (document.getElementById('phone') && document.getElementById('phone').value.trim()) || '';
    if (!nameVal || !phoneVal){ alert('Please enter name and phone.'); return; }

    const t = calcTotals();
    const order = {
      name: nameVal,
      phone: phoneVal,
      email: (document.getElementById('email') && document.getElementById('email').value.trim()) || '',
      product: productSelect.value,
      priceEach: t.price,
      qty: t.qty,
      shippingCountry: countrySelect.value,
      shippingCost: t.shipCost,
      total: t.grand,
      note: (document.getElementById('note') && document.getElementById('note').value.trim()) || '',
      eta: t.eta,
      timestamp: new Date().toISOString()
    };

    // store locally
    try { const all = JSON.parse(localStorage.getItem('greenwrite_orders') || '[]'); all.unshift(order); localStorage.setItem('greenwrite_orders', JSON.stringify(all)); } catch(e){}

    // Build human-friendly message (plain text)
    const countryNames = { IN: 'India', US: 'United States', UK: 'United Kingdom', AU: 'Australia', OTHER: 'Other' };
    const countryLabel = countryNames[(order.shippingCountry || 'IN').toUpperCase()] || order.shippingCountry || '—';
    const itemsLine = `${order.product} x${order.qty} — ₹${order.priceEach} each (₹${order.priceEach * order.qty})`;

    const messageLines = [
      "🌱 GreenWrite — Order",
      `Name: ${order.name}`,
      `Phone: ${order.phone}`,
      `Email: ${order.email || '-'}`,
      `Product: ${itemsLine}`,
      `Shipping: ${countryLabel} (${(order.shippingCountry || '').toUpperCase()}) — ₹${order.shippingCost}`,
      `ETA: ${order.eta}`,
      `Total: ₹${order.total}`,
      `Note: ${order.note || '-'}`,
      "",
      "Ordered via: Website created by Bharat — Team GreenWrite"
    ];
    const message = messageLines.join("\n");

    // Encode exactly once
    const encoded = encodeURIComponent(message);

    // Preferred WhatsApp targets
    const waNumber = '584161689126';
    const whatsappScheme = `whatsapp://send?phone=${waNumber}&text=${encoded}`; // direct app scheme
    const apiLink = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encoded}`; // web fallback
    const waMeLink = `https://wa.me/${waNumber}?text=${encoded}`; // alternate fallback

    function openUrl(url){
      try {
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          // mobile: change location (works better for custom schemes)
          window.location.href = url;
        } else {
          // desktop: open new tab
          window.open(url, '_blank');
        }
      } catch(err){
        window.open(url, '_blank');
      }
    }

    // Try in order: whatsapp:// (mobile), then apiLink, then wa.me
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      openUrl(whatsappScheme);
      // fallback attempts after short delays (some browsers block custom schemes)
      setTimeout(()=>openUrl(apiLink), 1200);
      setTimeout(()=>openUrl(waMeLink), 2400);
    } else {
      openUrl(apiLink);
      setTimeout(()=>openUrl(waMeLink), 1000);
    }

    // show success modal
    if (successModal) { successModal.classList.add('show'); successModal.setAttribute('aria-hidden','false'); }

    // Extra fallback: after 4s, if still on page, offer to copy message
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        if (!sessionStorage.getItem('gw_copy_shown')) {
          sessionStorage.setItem('gw_copy_shown','1');
          if (confirm('If WhatsApp did not open, press OK to copy the order message to clipboard so you can paste it into WhatsApp manually.')) {
            try {
              navigator.clipboard.writeText(message).then(()=>{
                alert('Message copied to clipboard. Open WhatsApp and paste to send.');
              }, ()=> {
                prompt('Copy the order message below (Ctrl+C / long-press):', message);
              });
            } catch(e){
              prompt('Copy the order message below (Ctrl+C / long-press):', message);
            }
          }
        }
      }
    }, 4000);

  }); // end orderForm submit

  /* ----------------------- preview, save, modal behaviors ----------------------- */
  if (previewBtn) previewBtn.addEventListener('click', () => {
    const t = calcTotals();
    const name = (document.getElementById('name') && document.getElementById('name').value) || '-';
    const phone = (document.getElementById('phone') && document.getElementById('phone').value) || '-';
    const note = (document.getElementById('note') && document.getElementById('note').value) || '';
    const html = `
      <div><strong>Name:</strong> ${escapeHtml(name)}</div>
      <div><strong>Phone:</strong> ${escapeHtml(phone)}</div>
      <div><strong>Product:</strong> ${escapeHtml(productSelect.value)} x ${t.qty} — ₹${t.price} each</div>
      <div style="display:flex;justify-content:space-between"><div>Items</div><div>₹${t.itemTotal}</div></div>
      <div style="display:flex;justify-content:space-between"><div>Shipping</div><div>₹${t.shipCost}</div></div>
      <hr/>
      <div style="display:flex;justify-content:space-between;font-weight:800"><div>Total</div><div>₹${t.grand}</div></div>
      <div style="margin-top:8px;color:var(--muted)"><strong>ETA:</strong> ${escapeHtml(t.eta)}</div>
      <div style="margin-top:8px;color:var(--muted)"><strong>Note:</strong> ${escapeHtml(note)}</div>
    `;
    if (orderDetails) orderDetails.innerHTML = html;
    if (orderModal) { orderModal.classList.add('show'); orderModal.setAttribute('aria-hidden','false'); }
    if (paymentArea) paymentArea.style.display = 'none';
  });

  if (editOrder) editOrder.addEventListener('click', () => { if (orderModal) { orderModal.classList.remove('show'); orderModal.setAttribute('aria-hidden','true'); } });
  if (confirmOrder) confirmOrder.addEventListener('click', () => { if (paymentArea) paymentArea.style.display = 'block'; });
  if (closeModal) closeModal.addEventListener('click', () => { if (orderModal) { orderModal.classList.remove('show'); orderModal.setAttribute('aria-hidden','true'); } });

  if (closeSuccess) closeSuccess.addEventListener('click', () => { if (successModal) { successModal.classList.remove('show'); successModal.setAttribute('aria-hidden','true'); } });

  // load draft if exists
  (function loadDraft(){
    try {
      const d = JSON.parse(localStorage.getItem('greenwrite_draft') || 'null');
      if (d && confirm('Load saved draft?')) {
        document.getElementById('name') && (document.getElementById('name').value = d.name || '');
        document.getElementById('phone') && (document.getElementById('phone').value = d.phone || '');
        document.getElementById('qty') && (document.getElementById('qty').value = d.qty || 1);
        [...productSelect.options].forEach(opt => { if (opt.value === d.product) opt.selected = true; });
        document.getElementById('note') && (document.getElementById('note').value = d.note || '');
        document.getElementById('email') && (document.getElementById('email').value = d.email || '');
        calcTotals();
      }
    } catch(e){}
  })();

  // helper
  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s])); }
})(); // end orderSystem

/* ================= BUY NOW buttons prefill ================= */
(function bindBuyNow(){
  $$('.prod .btn').forEach(b => {
    b.addEventListener('click', () => {
      const name = b.dataset.name || '';
      const qty = document.getElementById('qty');
      const prodSelect = document.getElementById('productSelect');
      if (prodSelect && name) {
        [...prodSelect.options].forEach(opt => { opt.selected = (opt.value === name); });
      }
      if (qty) qty.value = 1;
      const ev = new Event('input'); qty && qty.dispatchEvent(ev);
      const orderSec = document.getElementById('order');
      if (orderSec) orderSec.scrollIntoView({ behavior: 'smooth' });
      b.animate([{ transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220 });
    });
  });
})();

/* ================= CLOSE MODALS WITH ESC ================= */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $$('.modal.show').forEach(m => { m.classList.remove('show'); m.setAttribute('aria-hidden','true'); });
    const lb = document.getElementById('lightbox'); if (lb) lb.classList.remove('show');
  }
});

/* ================= IMAGE ERROR LOGGING ================= */
(function imageWarnings(){ $$('img').forEach(img => img.addEventListener('error', () => console.warn('Image failed to load:', img.src))); })();
