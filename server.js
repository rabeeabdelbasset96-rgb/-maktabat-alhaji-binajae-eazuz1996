const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'najah2026';

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'bookings.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'receipts');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf8');

app.use(express.json({limit:'2mb'}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/receipts', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, Date.now() + '-' + crypto.randomBytes(5).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('يسمح برفع صور الإيصالات فقط'));
  }
});

function readBookings(){ return JSON.parse(fs.readFileSync(DB_FILE,'utf8') || '[]'); }
function writeBookings(data){ fs.writeFileSync(DB_FILE, JSON.stringify(data,null,2), 'utf8'); }
function admin(req,res,next){
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) return res.status(401).json({error:'غير مصرح'});
  next();
}

app.get('/api/bookings', admin, (req,res)=>{
  let data = readBookings();
  const status = req.query.status;
  if(status && status !== 'all') data = data.filter(x=>x.status===status);
  data.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  res.json(data);
});

app.get('/api/stats', admin, (req,res)=>{
  const data = readBookings();
  const today = new Date().toISOString().slice(0,10);
  res.json({
    total:data.length,
    new:data.filter(x=>x.status==='new').length,
    confirmed:data.filter(x=>x.status==='confirmed').length,
    preparing:data.filter(x=>x.status==='preparing').length,
    ready:data.filter(x=>x.status==='ready').length,
    delivered:data.filter(x=>x.status==='delivered').length,
    cancelled:data.filter(x=>x.status==='cancelled').length,
    today:data.filter(x=>x.createdAt.slice(0,10)===today).length
  });
});

app.post('/api/bookings', upload.single('paymentReceipt'), (req,res)=>{
  try{
    const body = req.body;
    const items = JSON.parse(body.items || '[]');
    if(!body.studentName || !body.studentPhone || !items.length)
      return res.status(400).json({error:'بيانات الحجز الأساسية غير مكتملة'});

    const booking = {
      id: 'NAJ-' + new Date().getFullYear() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
      createdAt: new Date().toISOString(),
      status: 'new',
      studentName: body.studentName.trim(),
      studentPhone: body.studentPhone.trim(),
      address: {
        governorate: body.governorate || '',
        center: body.center || '',
        village: body.village || ''
      },
      paymentMethod: body.paymentMethod || 'الدفع عند الاستلام',
      paymentRef: body.paymentRef || '',
      receipt: req.file ? '/receipts/' + req.file.filename : '',
      notes: body.notes || '',
      items
    };
    const data = readBookings();
    data.push(booking);
    writeBookings(data);
    res.json({ok:true, booking});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'تعذر حفظ الحجز'});
  }
});

app.patch('/api/bookings/:id', admin, (req,res)=>{
  const allowed = ['new','confirmed','preparing','ready','delivered','cancelled'];
  const data = readBookings();
  const i = data.findIndex(x=>x.id===req.params.id);
  if(i<0) return res.status(404).json({error:'الحجز غير موجود'});
  if(req.body.status && allowed.includes(req.body.status)) data[i].status=req.body.status;
  if(typeof req.body.adminNote==='string') data[i].adminNote=req.body.adminNote;
  data[i].updatedAt = new Date().toISOString();
  writeBookings(data);
  res.json({ok:true, booking:data[i]});
});

app.delete('/api/bookings/:id', admin, (req,res)=>{
  const data = readBookings();
  const item=data.find(x=>x.id===req.params.id);
  if(!item) return res.status(404).json({error:'الحجز غير موجود'});
  writeBookings(data.filter(x=>x.id!==req.params.id));
  if(item.receipt){
    const file=path.join(__dirname,'data',item.receipt.replace('/receipts/','receipts/'));
    if(fs.existsSync(file)) fs.unlinkSync(file);
  }
  res.json({ok:true});
});

app.get('/dashboard', (req,res)=>res.sendFile(path.join(__dirname,'public','dashboard.html')));
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','booking.html')));

app.listen(PORT, ()=>console.log(`مكتبة النجاح تعمل على http://localhost:${PORT}`));
