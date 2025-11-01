// Minimal script.js - renders games/products and basic interactions (for WALZSHOP scaffold)
// Data (kept same as user's products - shortened sample for brevity)
const GAMES = [
  { key: "free-fire", name: "Free Fire", publisher: "Garena", img: "https://i.supaimg.com/023005b8-5541-4175-8563-072978e05973.jpg", url: "game.html?key=free-fire", needsServerId: false },
  { key: "mobile-legends", name: "Mobile Legends", publisher: "Moonton", img: "https://i.supaimg.com/3272ce04-c4a0-4025-8d8a-b2723a2f2267.jpg", url: "game.html?key=mobile-legends", needsServerId: true },
  { key: "genshin-impact", name: "Genshin Impact", publisher: "Hoyoverse", img: "https://i.supaimg.com/872628e9-c5f6-46f5-b5cc-8c8f3e8766c7.jpg", url: "game.html?key=genshin-impact", needsServerId: true }
];

const PAYMENTS = [
  { id: "qris", name: "QRIS", img: "https://i.supaimg.com/7b5fe49a-a708-4a05-8b00-9865481e0e13.jpg", qr: "https://files.catbox.moe/pa0iwo.png" },
  { id: "dana", name: "Dana", img: "https://i.supaimg.com/e4a887fd-41fd-4075-9802-8b65bb52d1cb.jpg", number: "083139243389", holder: "Anom" }
];

const PRODUCTS = {
  "free-fire": [
    { id: "ff-5", label: "5 Diamonds", price: 901 },
    { id: "ff-12", label: "12 Diamonds", price: 1802 }
  ],
  "mobile-legends": [
    { id: "ml-3", label: "3 Diamonds", price: 1171 },
    { id: "ml-5", label: "5 Diamonds", price: 1423 }
  ],
  "pulsa": {
    "telkomsel": [
      { id: "tel-5k", label: "Pulsa Rp 5.000", price: 6500 },
      { id: "tel-10k", label: "Pulsa Rp 10.000", price: 11500 }
    ]
  },
  "panel": [
    { name: "Paket 1", price: 10000, desc: "1 CPU, 256 MB RAM, 1 GB Storage" },
    { name: "Paket 2", price: 20000, desc: "2 CPU, 512 MB RAM, 2 GB Storage" }
  ]
};

function formatRupiah(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(n)}

function renderGameCards(){
  const container = document.getElementById('game-list'); if(!container) return;
  container.innerHTML='';
  GAMES.forEach(g=>{
    const a=document.createElement('a'); a.href=g.url; a.className='game-card';
    a.innerHTML=`<img src="${g.img}" alt="${g.name}"><div><strong>${g.name}</strong><div style="font-size:12px;color:#9fb0c8">${g.publisher}</div></div>`;
    container.appendChild(a);
  });
}

function getUrlParameter(name){const params=new URLSearchParams(window.location.search); return params.get(name)||'';}

// Game page setup
function setupGamePage(){
  const key = getUrlParameter('key'); if(!key) return;
  const game = GAMES.find(g=>g.key===key); if(!game) return;
  const header = document.getElementById('game-info-header');
  header.innerHTML=`<img src="${game.img}" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px"><h2>${game.name}</h2><p style="color:#9fb0c8">${game.publisher}</p>`;
  // products
  const productList = document.getElementById('product-list'); productList.innerHTML='';
  (PRODUCTS[key]||[]).forEach(p=>{
    const d=document.createElement('div'); d.className='option-card'; d.dataset.id=p.id; d.innerHTML=`<div>${p.label}</div><div style="font-weight:700">${formatRupiah(p.price)}</div>`;
    d.onclick=()=>{ document.querySelectorAll('.option-card').forEach(x=>x.classList.remove('selected')); d.classList.add('selected'); updateSummary(); };
    productList.appendChild(d);
  });
  // payments
  const paymentList = document.getElementById('payment-list'); paymentList.innerHTML='';
  PAYMENTS.forEach(pay=>{ const pd=document.createElement('div'); pd.className='option-card'; pd.dataset.id=pay.id; pd.innerHTML=`<div>${pay.name}</div>`; pd.onclick=()=>{ document.querySelectorAll('#payment-list .option-card').forEach(x=>x.classList.remove('selected')); pd.classList.add('selected'); updateSummary(); }; paymentList.appendChild(pd); });
  document.getElementById('user-id').addEventListener('input', updateSummary); document.getElementById('whatsapp-number').addEventListener('input', updateSummary);
}

function updateSummary(){
  const selectedProduct = document.querySelector('#product-list .option-card.selected');
  const selectedPayment = document.querySelector('#payment-list .option-card.selected');
  const userId = document.getElementById('user-id').value;
  const wa = document.getElementById('whatsapp-number').value;
  const summary = document.getElementById('summary-card');
  const confirm = document.getElementById('confirm-button');
  if(selectedProduct && selectedPayment && userId && wa){
    summary.style.display='block'; confirm.disabled=false;
    const pid = selectedProduct.dataset.id; const key = getUrlParameter('key');
    const prod = (PRODUCTS[key]||[]).find(x=>x.id===pid);
    document.getElementById('summary-product-details').innerText = prod.label;
    document.getElementById('summary-price').innerText = formatRupiah(prod.price);
  }else{ summary.style.display='none'; confirm.disabled=true; }
}

function setupEventListeners(){
  const search = document.getElementById('game-search'); if(search){ search.addEventListener('input', ()=>{ const q=search.value.toLowerCase(); document.querySelectorAll('.game-card').forEach(card=>{ const t=card.textContent.toLowerCase(); card.style.display = t.includes(q)?'flex':'none'; }) }); }
  const themeToggle = document.getElementById('theme-toggle'); if(themeToggle) themeToggle.addEventListener('click', ()=>{ document.body.classList.toggle('light'); });
  document.getElementById('confirm-button')?.addEventListener('click', ()=>{ const prod = document.querySelector('#product-list .option-card.selected'); const pay = document.querySelector('#payment-list .option-card.selected'); const userId = document.getElementById('user-id').value; const wa = document.getElementById('whatsapp-number').value; if(prod&&pay){ const url = `cart.html?game_key=${getUrlParameter('key')}&product_id=${prod.dataset.id}&payment_id=${pay.dataset.id}&user_id=${userId}&whatsapp_number=${wa}`; window.location.href = url; } });
  document.getElementById('pay-button')?.addEventListener('click', ()=>{ const params = new URLSearchParams(window.location.search); window.location.href = `https://wa.me/6282298902274?text=${encodeURIComponent('Halo saya ingin bayar, order id: '+params.get('orderId'))}`; });
  document.getElementById('panel-order-button')?.addEventListener('click', ()=>{ const name=document.getElementById('user-name').value; const wa=document.getElementById('user-whatsapp').value; const sel = document.querySelector('#panel-product-list .option-card.selected'); if(!name||!wa||!sel){ alert('Lengkapi data'); return;} const url = `https://wa.me/6282298902274?text=${encodeURIComponent('Order panel: '+sel.dataset.name+' - '+name+' - '+wa)}`; window.location.href = url; });
}

function setupPulsaPage(){
  const operatorSelect = document.getElementById('operator-select'); if(!operatorSelect) return;
  Object.keys(PRODUCTS.pulsa).forEach(op=>{ const o=document.createElement('option'); o.value=op; o.textContent=op; operatorSelect.appendChild(o); });
  operatorSelect.addEventListener('change', ()=>{ const list = document.getElementById('pulsa-list'); list.innerHTML=''; (PRODUCTS.pulsa[operatorSelect.value]||[]).forEach(p=>{ const d=document.createElement('div'); d.className='option-card'; d.dataset.id=p.id; d.dataset.label=p.label; d.innerHTML = `<div>${p.label}</div><div style="font-weight:700">${formatRupiah(p.price)}</div>`; d.onclick=()=>{ document.querySelectorAll('#pulsa-list .option-card').forEach(x=>x.classList.remove('selected')); d.classList.add('selected'); const summary=document.getElementById('summary-card'); summary.style.display='block'; document.getElementById('summary-product-details').innerText=p.label; document.getElementById('summary-price').innerText=formatRupiah(p.price); document.getElementById('confirm-button').disabled=false; }; list.appendChild(d); }); });
}

function setupPanelPage(){
  const list = document.getElementById('panel-product-list'); if(!list) return;
  PRODUCTS.panel.forEach(p=>{ const d=document.createElement('div'); d.className='option-card'; d.dataset.name = p.name; d.dataset.price = p.price; d.innerHTML=`<div>${p.name}</div><div style="font-weight:700">${formatRupiah(p.price)}</div><small>${p.desc}</small>`; d.addEventListener('click', ()=>{ document.querySelectorAll('#panel-product-list .option-card').forEach(x=>x.classList.remove('selected')); d.classList.add('selected'); document.getElementById('panel-order-button').disabled=false; }); list.appendChild(d); });
}

function setupCartPage(){
  const params = new URLSearchParams(window.location.search);
  const gameKey = params.get('game_key'); const productId = params.get('product_id'); const paymentId = params.get('payment_id'); const userId = params.get('user_id'); const whatsapp = params.get('whatsapp_number'); const game = GAMES.find(g=>g.key===gameKey); const product = (PRODUCTS[gameKey]||[]).find(p=>p.id===productId); const payment = PAYMENTS.find(p=>p.id===paymentId);
  const card = document.getElementById('cart-summary-card'); if(!card){return;} if(game && product && payment){ card.innerHTML = `<h3>Rincian Pesanan</h3><div>Game: ${game.name}</div><div>Produk: ${product.label}</div><div>Player ID: ${userId}</div><div>Metode: ${payment.name}</div><div>Total: ${formatRupiah(product.price)}</div>`; } else { card.innerHTML='<p>Data pesanan tidak ditemukan.</p>'; }
}

document.addEventListener('DOMContentLoaded', ()=>{ renderGameCards(); setupEventListeners(); if(document.getElementById('product-list')) setupGamePage(); if(document.getElementById('operator-select')) setupPulsaPage(); if(document.getElementById('panel-product-list')) setupPanelPage(); if(document.getElementById('cart-summary-card')) setupCartPage(); });
