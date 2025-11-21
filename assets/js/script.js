/* assets/js/script.js
   - Sticky header, mobile menu, dark mode
   - Hero typed text, parallax, counters
   - Slideshows, lightbox
   - Shipping calculator (India base = ₹40, free > ₹500, bulk free)
   - Order form -> WhatsApp (mobile safe)
   - Cart system with animation
   - REAL Firebase Auth (Google + email/password)
   - Shows logged-in user’s name in header profile button
*/

/* ========== SMALL HELPERS ========== */
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const safe = fn => { try { return fn(); } catch(e){ console.warn(e); } };

/* ========== HEADER, MENU, DARK MODE ========== */
(function headerAndUI(){
  const header    = document.querySelector('.site-header') || document.querySelector('header');
  const menuBtn   = $('#menuBtn');
  const mobileMenu= $('#mobileMenu');

  window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('shrink');
    else header.classList.remove('shrink');
  }, { passive:true });

  if (menuBtn && mobileMenu){
    const openMenu = () => {
      mobileMenu.classList.add('open');
      menuBtn.classList.add('open');
      menuBtn.setAttribute('aria-expanded','true');
      document.body.classList.add('lock');
      mobileMenu.setAttribute('aria-hidden','false');
    };
    const closeMenu = () => {
      mobileMenu.classList.remove('open');
      menuBtn.classList.remove('open');
      menuBtn.setAttribute('aria-expanded','false');
      document.body.classList.remove('lock');
      mobileMenu.setAttribute('aria-hidden','true');
    };
    menuBtn.addEventListener('click', () => {
      if (mobileMenu.classList.contains('open')) closeMenu(); else openMenu();
    });
    $$('.mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

    function updateNav(){
      const mainNav = document.querySelector('.main-nav');
      if (!mainNav) return;
      if (window.innerWidth <= 980){
        mainNav.style.display = 'none';
        menuBtn.style.display = 'flex';
      } else {
        mainNav.style.display = 'flex';
        menuBtn.style.display = 'none';
        closeMenu();
      }
    }
    updateNav();
    window.addEventListener('resize', updateNav);
  }

  // Dark mode
  const DARK_KEY = 'greenwrite_dark_v1';
  const darkToggle = $('#darkToggle');
  const mobileDarkToggle = $('#mobileDarkToggle');

  function setDark(on){
    if (on) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    try { localStorage.setItem(DARK_KEY, on ? '1' : '0'); } catch(e){}
  }

  (function initDark(){
    let stored = null;
    try { stored = localStorage.getItem(DARK_KEY); } catch(e){}
    if (stored === null){
      const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefers);
    } else setDark(stored === '1');
  })();

  darkToggle && darkToggle.addEventListener('click', () => setDark(!document.body.classList.contains('dark')));
  mobileDarkToggle && mobileDarkToggle.addEventListener('click', () => setDark(!document.body.classList.contains('dark')));
})();

/* ========== TYPED TEXT & PARALLAX ========== */
(function typedAndParallax(){
  const typedEl = $('#typedText') || $('#typedTextSmall');
  const words = ["Write your future.", "Grow your planet."];

  if (typedEl){
    let wI = 0, cI = 0;
    (function loop(){
      const w = words[wI];
      typedEl.textContent = w.slice(0, cI);
      cI++;
      if (cI > w.length + 8){
        cI = 0;
        wI = (wI+1) % words.length;
        setTimeout(loop, 700);
      } else setTimeout(loop, 60);
    })();
  }

  const heroWrap = $('#heroWrap');
  const heroBg   = $('#heroBg');
  if (heroWrap && heroBg){
    heroWrap.addEventListener('mousemove', e => {
      const rect = heroWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      heroBg.style.transform = `translate(${x*18}px, ${y*12}px) rotate(${x*2}deg)`;
    });
  }
})();

/* ========== REVEAL & COUNTERS ========== */
(function revealAndCounters(){
  const elems = document.querySelectorAll('.fade-in, .reveal-list');
  const obs = new IntersectionObserver((entries, ob)=>{
    entries.forEach(ent=>{
      if (ent.isIntersecting){
        ent.target.classList.add('show');
        ob.unobserve(ent.target);
      }
    });
  }, { threshold:0.12 });
  elems.forEach(e => obs.observe(e));

  const stats = $('.stats');
  if (stats){
    const cobs = new IntersectionObserver((entries, ob)=>{
      entries.forEach(ent=>{
        if (ent.isIntersecting){
          $$('.num').forEach(el=>{
            const target = +el.getAttribute('data-target') || 0;
            let current = 0;
            const step = Math.max(1, Math.floor(target/80));
            const t = setInterval(()=>{
              current += step;
              if (current >= target){ el.textContent = target; clearInterval(t); }
              else el.textContent = current;
            }, 18);
          });
          ob.disconnect();
        }
      });
    }, { threshold:0.2 });
    cobs.observe(stats);
  }
})();

/* ========== SLIDESHOWS ========== */
function startSlideshow(containerId, interval = 3600){
  safe(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const slides = Array.from(container.querySelectorAll('.slide'));
    if (!slides.length) return;
    const prev = container.querySelector('.slide-prev');
    const next = container.querySelector('.slide-next');
    let idx = 0;
    function show(i){
      slides.forEach(s => s.classList.remove('active'));
      slides[i].classList.add('active');
    }
    show(idx);
    let timer = setInterval(()=>{
      idx = (idx+1) % slides.length;
      show(idx);
    }, interval);
    container.addEventListener('mouseenter', ()=> clearInterval(timer));
    container.addEventListener('mouseleave', ()=> {
      timer = setInterval(()=>{ idx = (idx+1) % slides.length; show(idx); }, interval);
    });
    prev && prev.addEventListener('click', ()=>{ idx = (idx-1+slides.length)%slides.length; show(idx); });
    next && next.addEventListener('click', ()=>{ idx = (idx+1)%slides.length; show(idx); });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  startSlideshow('heroSlideshow', 3500);
  startSlideshow('prodSlideshow', 3500);
});

/* ========== LIGHTBOX ========== */
(function lightboxInit(){
  const lb    = $('#lightbox');
  const lbimg = $('#lbimg') || $('#lightbox-img');
  if (!lb || !lbimg) return;

  $$('.view-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const src = btn.dataset.img ||
        (btn.closest('.prod') && btn.closest('.prod').querySelector('img') && btn.closest('.prod').querySelector('img').src) || '';
      if (src) lbimg.src = src;
      lb.classList.add('show'); lb.setAttribute('aria-hidden','false');
    });
  });

  $$('.gallery-grid img').forEach(img=>{
    img.addEventListener('click', e=>{
      lbimg.src = e.target.src;
      lb.classList.add('show'); lb.setAttribute('aria-hidden','false');
    });
  });

  lb.addEventListener('click', e=>{
    if (e.target === lb){
      lb.classList.remove('show');
      lb.setAttribute('aria-hidden','true');
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('show'); });
})();

/* ========== BACK TO TOP ========== */
(function backToTop(){
  const topBtn = $('#topBtn');
  if (!topBtn) return;
  window.addEventListener('scroll', ()=> {
    if (window.scrollY > 450) topBtn.classList.add('show');
    else topBtn.classList.remove('show');
  }, { passive:true });
  topBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
})();

/* ========== SHIPPING CONFIG ========== */
const FREE_SHIPPING_MIN_ORDER = 500;
const BULK_FREE_QTY          = 50;
const packagingWeightG       = 30;

const shippingRates = {
  "IN":[ {maxKg:0.25,cost:40},{maxKg:0.5,cost:70},{maxKg:1.0,cost:110},{maxKg:2.0,cost:180},{maxKg:5.0,cost:320} ],
  "US":[ {maxKg:0.25,cost:600},{maxKg:0.5,cost:900},{maxKg:1.0,cost:1300},{maxKg:2.0,cost:2200},{maxKg:5.0,cost:3600} ],
  "UK":[ {maxKg:0.25,cost:550},{maxKg:0.5,cost:820},{maxKg:1.0,cost:1250},{maxKg:2.0,cost:2100},{maxKg:5.0,cost:3400} ],
  "AU":[ {maxKg:0.25,cost:650},{maxKg:0.5,cost:1000},{maxKg:1.0,cost:1500},{maxKg:2.0,cost:2600},{maxKg:5.0,cost:3900} ],
  "OTHER":[ {maxKg:0.25,cost:900},{maxKg:0.5,cost:1300},{maxKg:1.0,cost:2000},{maxKg:2.0,cost:3400},{maxKg:5.0,cost:5600} ]
};

function estimateETA(countryCode, weightKg){
  countryCode = (countryCode || 'IN').toUpperCase();
  if (countryCode === 'IN'){
    if (weightKg <= 0.5) return '3-5 business days';
    if (weightKg <= 1)   return '5-7 business days';
    if (weightKg <= 2)   return '7-10 business days';
    return '10-14 business days';
  }
  if (countryCode === 'US' || countryCode === 'UK' || countryCode === 'AU'){
    if (weightKg <= 0.5) return '7-12 business days';
    if (weightKg <= 1)   return '10-15 business days';
    if (weightKg <= 2)   return '12-20 business days';
    return '18-30 business days';
  }
  if (weightKg <= 0.5) return '10-18 business days';
  if (weightKg <= 1)   return '12-22 business days';
  return '20-35 business days';
}

/* Shipping panel under summary */
function ensureShippingPanel(){
  const summary = $('.summary-box') || $('.order-form');
  if (!summary) return null;
  let panel = $('#shipCalcPanel');
  if (!panel){
    panel = document.createElement('div');
    panel.id = 'shipCalcPanel';
    panel.className = 'ship-calc';
    panel.style.marginTop = '10px';
    panel.style.padding   = '10px';
    panel.style.borderRadius = '8px';
    panel.style.background = 'rgba(255,255,255,0.92)';
    panel.style.border = '1px solid rgba(0,0,0,0.04)';
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

/* ========== ORDER FORM + CART + WHATSAPP ========== */
(function orderSystem(){
  const productSelect = $('#productSelect');
  const qtyInput      = $('#qty');
  const countrySelect = $('#country');
  const itemsTotalEl  = $('#itemsTotal');
  const shipCostEl    = $('#shipCost');
  const grandTotalEl  = $('#grandTotal');
  const previewBtn    = $('#previewBtn');
  const orderForm     = $('#orderForm');
  const orderModal    = $('#orderModal');
  const orderDetails  = $('#orderDetails');
  const closeModal    = $('#closeModal');
  const confirmOrder  = $('#confirmOrder');
  const saveLocalBtn  = $('#saveLocal');
  const successModal  = $('#successModal');
  const closeSuccess  = $('#closeSuccess');
  const paymentArea   = $('#paymentArea');

  if (!productSelect || !qtyInput || !countrySelect || !itemsTotalEl || !shipCostEl || !grandTotalEl) return;

  const productWeightMap = { "Plantable Pen":12, "Plantable Pencil":10, "Combo Pack":25 };

  function calcTotals(){
    const price   = +productSelect.options[productSelect.selectedIndex].dataset.price || 0;
    const name    = productSelect.value;
    const qty     = Math.max(1, Math.floor(+qtyInput.value || 1));
    const itemTot = price * qty;

    const perItemG = +productSelect.options[productSelect.selectedIndex].dataset.weight || (productWeightMap[name] || 15);
    const totalG   = (perItemG * qty) + packagingWeightG;
    const totalKg  = Math.max(0.001, totalG / 1000);

    const countryCode = (countrySelect.value || 'IN').toUpperCase();
    const table = shippingRates[countryCode] || shippingRates.OTHER;
    let shipCost = table[table.length-1].cost;
    for (let i=0;i<table.length;i++){
      if (totalKg <= table[i].maxKg){ shipCost = table[i].cost; break; }
    }

    if (qty >= BULK_FREE_QTY) shipCost = 0;
    else if (itemTot >= FREE_SHIPPING_MIN_ORDER) shipCost = 0;

    itemsTotalEl.textContent = `₹${itemTot}`;
    shipCostEl.textContent   = `₹${shipCost}`;
    grandTotalEl.textContent = `₹${itemTot + shipCost}`;

    const panel = ensureShippingPanel();
    const etaText = estimateETA(countryCode, totalKg);
    if (panel){
      const estWeight = panel.querySelector('#estWeight');
      const eta       = panel.querySelector('#shipETA');
      const tier      = panel.querySelector('#shipTier');

      if (estWeight) estWeight.textContent = `${totalKg.toFixed(2)} kg`;
      if (eta) eta.textContent = etaText;

      let tierText = 'Standard';
      for (let i=0;i<table.length;i++){
        if (totalKg <= table[i].maxKg){ tierText = `Up to ${table[i].maxKg} kg • ₹${table[i].cost}`; break; }
      }
      if (shipCost === 0) tierText = 'Free shipping';
      if (tier) tier.textContent = tierText;
    }

    return { price, qty, itemTotal:itemTot, totalWeightKg:totalKg, shipCost, grand:itemTot+shipCost, eta:etaText };
  }

  productSelect.addEventListener('change', calcTotals);
  qtyInput.addEventListener('input', calcTotals);
  countrySelect.addEventListener('change', calcTotals);
  document.addEventListener('DOMContentLoaded', calcTotals);

  // save draft
  saveLocalBtn && saveLocalBtn.addEventListener('click', ()=>{
    const d = {
      name: $('#name')?.value || '',
      phone:$('#phone')?.value || '',
      product: productSelect.value,
      price: productSelect.options[productSelect.selectedIndex].dataset.price,
      qty: qtyInput.value,
      country: countrySelect.value,
      email: $('#email')?.value || '',
      note: $('#note')?.value || '',
      totals: calcTotals()
    };
    try {
      localStorage.setItem('greenwrite_draft', JSON.stringify(d));
      alert('Draft saved locally.');
    } catch(e){
      alert('Could not save draft.');
    }
  });

  // Load draft if exists
  (function loadDraft(){
    try {
      const d = JSON.parse(localStorage.getItem('greenwrite_draft') || 'null');
      if (d && confirm('Load saved draft?')){
        $('#name')  && ($('#name').value  = d.name  || '');
        $('#phone') && ($('#phone').value = d.phone || '');
        $('#qty')   && ($('#qty').value   = d.qty   || 1);
        [...productSelect.options].forEach(opt=>{ if (opt.value === d.product) opt.selected = true; });
        $('#note')  && ($('#note').value  = d.note  || '');
        $('#email') && ($('#email').value = d.email || '');
        calcTotals();
      }
    } catch(e){}
  })();

  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s])); }

  // Preview modal
  previewBtn && previewBtn.addEventListener('click', ()=>{
    const t = calcTotals();
    const name = $('#name')?.value || '-';
    const phone= $('#phone')?.value || '-';
    const note = $('#note')?.value || '';
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
    if (orderModal){ orderModal.classList.add('show'); orderModal.setAttribute('aria-hidden','false'); }
    if (paymentArea) paymentArea.style.display = 'none';
  });

  editOrder && editOrder.addEventListener('click', ()=>{ orderModal?.classList.remove('show'); orderModal?.setAttribute('aria-hidden','true'); });
  confirmOrder && confirmOrder.addEventListener('click', ()=>{ if (paymentArea) paymentArea.style.display = 'block'; });
  closeModal && closeModal.addEventListener('click', ()=>{ orderModal?.classList.remove('show'); orderModal?.setAttribute('aria-hidden','true'); });

  closeSuccess && closeSuccess.addEventListener('click', ()=>{ successModal?.classList.remove('show'); successModal?.setAttribute('aria-hidden','true'); });

  // WhatsApp submit
  orderForm && orderForm.addEventListener('submit', e=>{
    e.preventDefault();
    const nameVal  = $('#name')?.value.trim()  || '';
    const phoneVal = $('#phone')?.value.trim() || '';
    if (!nameVal || !phoneVal){ alert('Please enter name and phone.'); return; }
    const t = calcTotals();
    const order = {
      name: nameVal,
      phone: phoneVal,
      email: $('#email')?.value.trim() || '',
      product: productSelect.value,
      priceEach: t.price,
      qty: t.qty,
      shippingCountry: countrySelect.value,
      shippingCost: t.shipCost,
      total: t.grand,
      note: $('#note')?.value.trim() || '',
      eta: t.eta,
      timestamp: new Date().toISOString()
    };

    try {
      const all = JSON.parse(localStorage.getItem('greenwrite_orders') || '[]');
      all.unshift(order);
      localStorage.setItem('greenwrite_orders', JSON.stringify(all));
    } catch(e){}

    const countryNames = { IN:'India', US:'United States', UK:'United Kingdom', AU:'Australia', OTHER:'Other' };
    const cLabel = countryNames[(order.shippingCountry || 'IN').toUpperCase()] || order.shippingCountry || '—';
    const itemsLine = `${order.product} x${order.qty} — ₹${order.priceEach} each (₹${order.priceEach * order.qty})`;

    const messageLines = [
      "🌱 GreenWrite — Order",
      `Name: ${order.name}`,
      `Phone: ${order.phone}`,
      `Email: ${order.email || '-'}`,
      `Product: ${itemsLine}`,
      `Shipping: ${cLabel} (${(order.shippingCountry || '').toUpperCase()}) — ₹${order.shippingCost}`,
      `ETA: ${order.eta}`,
      `Total: ₹${order.total}`,
      `Note: ${order.note || '-'}`
    ];
    const message = messageLines.join("\n");
    const encoded = encodeURIComponent(message);

    const waNumber      = '584161689126';
    const whatsappScheme= `whatsapp://send?phone=${waNumber}&text=${encoded}`;
    const apiLink       = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encoded}`;
    const waMeLink      = `https://wa.me/${waNumber}?text=${encoded}`;

    function openUrl(url){
      try {
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
          window.location.href = url;
        } else {
          window.open(url, '_blank');
        }
      } catch(err){
        window.open(url, '_blank');
      }
    }

    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
      openUrl(whatsappScheme);
      setTimeout(()=>openUrl(apiLink), 1200);
      setTimeout(()=>openUrl(waMeLink), 2400);
    } else {
      openUrl(apiLink);
      setTimeout(()=>openUrl(waMeLink), 1000);
    }

    if (successModal){
      successModal.classList.add('show');
      successModal.setAttribute('aria-hidden','false');
    }

    setTimeout(()=>{
      if (document.visibilityState === 'visible' && !sessionStorage.getItem('gw_copy_shown')){
        sessionStorage.setItem('gw_copy_shown','1');
        if (confirm('If WhatsApp did not open, press OK to copy the order message so you can paste it into WhatsApp manually.')){
          try{
            navigator.clipboard.writeText(message).then(()=>{
              alert('Message copied to clipboard. Open WhatsApp and paste.');
            }, ()=>{
              prompt('Copy the order message below:', message);
            });
          } catch(e){
            prompt('Copy the order message below:', message);
          }
        }
      }
    }, 4000);
  });

  /* ===== CART SYSTEM ===== */
  (function cartSystem(){
    const CART_KEY   = 'greenwrite_cart_v1';
    const cartBtn    = $('#cartBtn');
    const cartCount  = $('#cartCount');
    const cartModal  = $('#cartModal');
    const cartItemsEl= $('#cartItems');
    const cartTotalEl= $('#cartTotal');
    const cartClose  = $('#cartClose');
    const cartUse    = $('#cartUse');
    const cartClear  = $('#cartClear');

    function loadCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e){return [];} }
    function saveCart(c){ try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch(e){} }
    function updateCartCount(){
      const cart = loadCart();
      const count = cart.reduce((s,i)=>s+i.qty,0);
      if (cartCount) cartCount.textContent = count;
    }

    function renderCart(){
      const cart = loadCart();
      if (!cartItemsEl || !cartTotalEl) return;
      if (!cart.length){
        cartItemsEl.innerHTML = `<p class="small" style="color:var(--muted)">Your cart is empty. Add some plantable pens & pencils! 🌱</p>`;
        cartTotalEl.textContent = '0';
        return;
      }
      let html = '';
      let total = 0;
      cart.forEach((item, idx)=>{
        const line = item.price * item.qty;
        total += line;
        html += `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div>
              <strong>${item.name}</strong><br>
              <span class="small">₹${item.price} × ${item.qty} = ₹${line}</span>
            </div>
            <div style="display:flex;gap:4px;align-items:center">
              <button data-idx="${idx}" class="cart-minus" style="border:0;border-radius:6px;padding:2px 8px;cursor:pointer">−</button>
              <button data-idx="${idx}" class="cart-plus"  style="border:0;border-radius:6px;padding:2px 8px;cursor:pointer">+</button>
            </div>
          </div>
        `;
      });
      cartItemsEl.innerHTML = html;
      cartTotalEl.textContent = total;

      cartItemsEl.querySelectorAll('.cart-minus').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx = +btn.dataset.idx;
          let cart = loadCart();
          if (!cart[idx]) return;
          cart[idx].qty -= 1;
          if (cart[idx].qty <= 0) cart.splice(idx,1);
          saveCart(cart); updateCartCount(); renderCart();
        });
      });
      cartItemsEl.querySelectorAll('.cart-plus').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx = +btn.dataset.idx;
          let cart = loadCart();
          if (!cart[idx]) return;
          cart[idx].qty += 1;
          saveCart(cart); updateCartCount(); renderCart();
        });
      });
    }

    $$('.add-cart-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const name  = btn.dataset.name || 'Item';
        const price = +btn.dataset.price || 0;
        let cart = loadCart();
        const existing = cart.find(i => i.name === name && i.price === price);
        if (existing) existing.qty += 1;
        else cart.push({name, price, qty:1});
        saveCart(cart); updateCartCount();
        const card = btn.closest('.prod');
        if (card){
          card.animate(
            [{transform:'scale(1)'},{transform:'scale(1.04)'},{transform:'scale(1)'}],
            {duration:280, easing:'ease-out'}
          );
        }
      });
    });

    if (cartBtn && cartModal){
      cartBtn.addEventListener('click', ()=>{
        renderCart();
        cartModal.classList.add('show');
        cartModal.setAttribute('aria-hidden','false');
      });
    }
    if (cartClose && cartModal){
      cartClose.addEventListener('click', ()=>{
        cartModal.classList.remove('show');
        cartModal.setAttribute('aria-hidden','true');
      });
      cartModal.addEventListener('click', e=>{
        if (e.target === cartModal){
          cartModal.classList.remove('show');
          cartModal.setAttribute('aria-hidden','true');
        }
      });
    }
    cartClear && cartClear.addEventListener('click', ()=>{
      if (confirm('Clear all items from cart?')){
        saveCart([]); updateCartCount(); renderCart();
      }
    });
    cartUse && cartUse.addEventListener('click', ()=>{
      const cart = loadCart();
      if (!cart.length){ alert('Cart is empty. Add a product first.'); return; }
      const first = cart[0];
      if (productSelect){
        [...productSelect.options].forEach(opt=>{ if (opt.value === first.name) opt.selected = true; });
      }
      if (qtyInput) qtyInput.value = first.qty;
      calcTotals();
      const orderSec = $('#order');
      orderSec && orderSec.scrollIntoView({behavior:'smooth'});
      cartModal && cartModal.classList.remove('show') && cartModal.setAttribute('aria-hidden','true');
    });

    updateCartCount();
  })();

})(); // end orderSystem

/* ========== BUY NOW (prefill form) ========== */
(function bindBuyNow(){
  $$('.buy-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      const name  = b.dataset.name || '';
      const prodSelect = $('#productSelect');
      const qty   = $('#qty');
      if (prodSelect && name){
        [...prodSelect.options].forEach(opt=>{ if (opt.value === name) opt.selected = true; });
      }
      if (qty) qty.value = 1;
      qty && qty.dispatchEvent(new Event('input'));
      const orderSec = $('#order');
      orderSec && orderSec.scrollIntoView({behavior:'smooth'});
      b.animate([{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:220});
    });
  });
})();

/* ========== REAL FIREBASE AUTH (GOOGLE + EMAIL/PASSWORD ONLY) ========== */
/* Uses Firebase compat SDK loaded in index.html / products.html */

(function authModalInit(){
  const modal      = $('#authModal');
  const profileBtn = $('#profileBtn');

  if (!modal) return;
  if (typeof firebase === 'undefined'){
    console.warn('Firebase SDK not loaded. Check script tags in HTML.');
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyBok3WdamaRJaVCzznMwB-lwHVWoHAM2i4",
    authDomain: "greenwrite-704d9.firebaseapp.com",
    projectId: "greenwrite-704d9",
    storageBucket: "greenwrite-704d9.firebasestorage.app",
    messagingSenderId: "815467329176",
    appId: "1:815467329176:web:d7d767409867d2c2eb82ed",
    measurementId: "G-2192KW3Y9J"
  };

  // Init only once
  try { firebase.app(); }
  catch(e){ firebase.initializeApp(firebaseConfig); }

  const auth     = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();

  const SKIP_KEY   = 'gw_seen_auth_v1';
  const authClose  = $('#authClose');
  const authSkip   = $('#authSkip');
  const authGoogle = $('#authGoogle');
  const authEmail  = $('#authEmail');
  const authStatus = $('#authStatus');
  const logoutBtn  = $('#logoutBtn');
  const loginBtns  = $('#authLoginButtons');

  function openModal(){
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    try { localStorage.setItem(SKIP_KEY,'1'); } catch(e){}
  }

  // Show logged-in user in header profile button
  function renderUser(user){
    if (profileBtn){
      if (user){
        const name = user.displayName || user.email || 'User';
        const first = name.split(' ')[0];
        profileBtn.innerHTML = `
          <span class="avatar-circle">${first[0].toUpperCase()}</span>
          <span class="profile-name">${first}</span>
        `;
        profileBtn.classList.add('profile-btn');
        profileBtn.title = name;
      } else {
        profileBtn.textContent = '👤';
        profileBtn.classList.remove('profile-btn');
        profileBtn.title = 'Login / Profile';
      }
    }

    if (authStatus){
      if (user){
        const name = user.displayName || user.email || 'GreenWrite user';
        authStatus.textContent = `Logged in as ${name}. We will use this to fill the order form in this browser.`;
      } else {
        authStatus.textContent = 'Login with Google or Email & Password. You can also close and continue as guest.';
      }
    }

    if (loginBtns){
      loginBtns.style.display = user ? 'none' : 'flex';
    }
    if (logoutBtn){
      logoutBtn.style.display = user ? 'inline-block' : 'none';
    }
  }

  auth.onAuthStateChanged(user=>{
    renderUser(user);
  });

  // First visit: show login popup after 1s (only once)
  try {
    if (localStorage.getItem(SKIP_KEY) !== '1'){
      setTimeout(openModal, 1000);
    }
  } catch(e){}

  profileBtn && profileBtn.addEventListener('click', openModal);
  authClose  && authClose.addEventListener('click', closeModal);
  authSkip   && authSkip.addEventListener('click', closeModal);
  modal.addEventListener('click', e=>{ if (e.target === modal) closeModal(); });

  // Google sign-in
  authGoogle && authGoogle.addEventListener('click', async ()=>{
    try {
      await auth.signInWithPopup(provider);
      alert('Logged in with Google!');
      closeModal();
    } catch(err){
      console.error(err);
      alert(err.message || 'Google sign-in failed.');
    }
  });

  // Email/password login + signup using prompts
  authEmail && authEmail.addEventListener('click', async ()=>{
    const email = prompt('Enter email:');
    if (!email) return;
    const pass  = prompt('Enter password (min 6 characters):');
    if (!pass) return;

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      alert('Logged in successfully!');
      closeModal();
    } catch(err){
      if (err.code === 'auth/user-not-found'){
        if (confirm('No account found with this email. Create a new account?')){
          try {
            const cred = await auth.createUserWithEmailAndPassword(email, pass);
            const displayName = prompt('Enter your name (optional):');
            if (displayName){
              await cred.user.updateProfile({ displayName });
            }
            alert('Account created & logged in!');
            closeModal();
          } catch(e2){
            console.error(e2);
            alert(e2.message || 'Could not create account.');
          }
        }
      } else {
        console.error(err);
        alert(err.message || 'Login failed.');
      }
    }
  });

  // Logout
  logoutBtn && logoutBtn.addEventListener('click', async ()=>{
    try {
      await auth.signOut();
      alert('Logged out.');
      renderUser(null);
      closeModal();
    } catch(e){
      console.error(e);
      alert('Logout failed.');
    }
  });

})();

/* ========== ESC closes modals + image error log ========== */
document.addEventListener('keydown', e=>{
  if (e.key === 'Escape'){
    $$('.modal.show').forEach(m => { m.classList.remove('show'); m.setAttribute('aria-hidden','true'); });
    const lb = $('#lightbox'); lb && lb.classList.remove('show');
  }
});

(function imageWarnings(){
  $$('img').forEach(img=>{
    img.addEventListener('error', ()=> console.warn('Image failed to load:', img.src));
  });
})();
