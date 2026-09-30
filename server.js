require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const MAIL_TO = process.env.MAIL_TO || 'marketiqo016@gmail.com';

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"], // inline onclick handlers used in the page
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ['https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));
if (process.env.CORS_ORIGIN) app.use(cors({ origin: process.env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '20kb' }));

const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (v, n) => String(v || '').trim().slice(0, n);

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
} else {
  console.warn('SMTP not configured: inquiries will be saved to data/inquiries.jsonl only.');
}

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a few minutes.' } });

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/contact', limiter, async (req, res) => {
  const b = req.body || {};
  if (b.hp) return res.json({ ok: true }); // honeypot: silently drop bots
  const d = {
    name: clip(b.name, 100), email: clip(b.email, 200), phone: clip(b.phone, 40),
    company: clip(b.company, 120), website: clip(b.website, 200), service: clip(b.service, 60),
    budget: clip(b.budget, 60), message: clip(b.message, 5000),
  };
  if (!d.name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  try {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    fs.appendFileSync(path.join(__dirname, 'data', 'inquiries.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...d }) + '\n');
  } catch (e) { console.error('Could not save inquiry:', e.message); }

  if (!transporter) return res.json({ ok: true });
  try {
    const rows = Object.entries(d).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${esc(k)}</b></td><td>${esc(v) || '-'}</td></tr>`).join('');
    await transporter.sendMail({
      from: `"MARKETIQO Website" <${process.env.SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: d.email,
      subject: `New inquiry from ${d.name}${d.service ? ' - ' + d.service : ''}`,
      html: `<h2>New website inquiry</h2><table>${rows}</table>`,
      text: Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n'),
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Mail error:', e.message);
    res.status(500).json({ error: 'We could not send your inquiry right now. Please email us directly.' });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(express.static(__dirname, { extensions: ['html'], maxAge: '1h' }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`MARKETIQO running on http://localhost:${PORT}`));
