require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { Low, JSONFile } = require('lowdb');
const http = require('http');
const shortid = require('shortid');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Cloudinary config
if(process.env.CLOUDINARY_URL){ cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL }); } 

// LowDB
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);
(async()=>{ await db.read(); db.data ||= { orders: [], proofs: [], likes: {}, comments: {} }; await db.write(); })();

// Cloudinary storage
const storage = new CloudinaryStorage({ cloudinary, params: { folder: process.env.CLOUDINARY_FOLDER || 'walzshop_bukti', allowed_formats: ['jpg','jpeg','png'], public_id: (req,file)=>`proof_${Date.now()}_${shortid.generate()}` } });
const upload = multer({ storage });

app.post('/api/order', async (req,res)=>{
  await db.read();
  const body = req.body || {};
  const id = `ORD-${shortid.generate().toUpperCase()}`;
  const order = { id, createdAt: Date.now(), status: 'pending', proof: null, ...body };
  db.data.orders.unshift(order);
  await db.write();
  res.json({ ok:true, order });
});

app.post('/api/upload', upload.single('file'), async (req,res)=>{
  await db.read();
  const orderId = req.body.orderId;
  if(!orderId) return res.status(400).json({ error: 'Missing orderId' });
  const order = db.data.orders.find(o=>o.id===orderId);
  if(!order) return res.status(404).json({ error: 'Order not found' });
  if(!req.file || !req.file.path) return res.status(500).json({ error: 'Upload failed' });
  const proof = { id: `PRF-${shortid.generate().toUpperCase()}`, orderId: order.id, url: req.file.path, uploadedAt: Date.now() };
  order.proof = proof; order.status = 'proof_sent'; db.data.proofs.unshift(proof); await db.write();
  io.emit('new_proof', { proof, orderSummary: { id: order.id, total: order.total || order.price || 0 } });
  // CallMeBot notify
  try{
    const key = process.env.CALLMEBOT_KEY;
    const admin = process.env.ADMIN_PHONE;
    if(key && admin){
      const text = encodeURIComponent(`Ada bukti transfer baru\nOrder: ${order.id}\nLink: ${proof.url}`);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${admin}&text=${text}&apikey=${key}`;
      fetch(url).catch(e=>console.warn('WA notify failed', e));
    }
  }catch(e){ console.warn('notify error', e); }
  res.json({ ok:true, order, proof });
});

// admin endpoints (simple)
app.post('/api/admin/login', async (req,res)=>{
  const pw = (req.body && req.body.password) || '';
  if(pw !== process.env.ADMIN_PASS) return res.status(401).json({ error: 'Invalid password' });
  res.json({ ok:true, token: 'admintoken' });
});

app.get('/api/admin/proofs', async (req,res)=>{ await db.read(); res.json({ ok:true, proofs: db.data.proofs || [] }); });

// likes/comments (simple)
app.post('/api/like/:productId', async (req,res)=>{ await db.read(); const pid=req.params.productId; const action=req.body.action; db.data.likes[pid] = db.data.likes[pid] || { likes:0, dislikes:0 }; if(action==='like') db.data.likes[pid].likes++; else db.data.likes[pid].dislikes++; await db.write(); io.emit('like_updated', { productId: pid, stats: db.data.likes[pid] }); res.json({ ok:true, stats: db.data.likes[pid] }); });
app.post('/api/comment/:productId', async (req,res)=>{ await db.read(); const pid=req.params.productId; const { username, text } = req.body; db.data.comments[pid] = db.data.comments[pid] || []; const c = { id: shortid.generate(), username: username || 'Anon', text, createdAt: Date.now() }; db.data.comments[pid].unshift(c); await db.write(); io.emit('new_comment', { productId: pid, comment: c }); res.json({ ok:true, comment: c }); });

app.get('/api/health', (req,res)=>res.json({ ok:true }));

io.on('connection', socket=>{ console.log('socket connected', socket.id); socket.on('disconnect', ()=>console.log('socket disconnected', socket.id)); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log('Server running on port', PORT));
