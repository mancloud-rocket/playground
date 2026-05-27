'use strict';

require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_USER = process.env.AUTH_USER || '';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-in-production';
const SESSION_COOKIE = 'rb_playground';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!AUTH_USER || !AUTH_PASSWORD) {
  console.warn('Warning: AUTH_USER and AUTH_PASSWORD must be set in environment variables.');
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return body + '.' + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || !payload.u || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function isAuthed(req) {
  return !!verifyToken(req.cookies[SESSION_COOKIE]);
}

function setSession(res, username) {
  const token = signToken({ u: username, exp: Date.now() + SESSION_MS });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MS,
    path: '/',
  });
}

function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  const nextPath = encodeURIComponent(req.originalUrl || '/hub');
  return res.redirect('/?next=' + nextPath);
}

app.post('/api/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!AUTH_USER || !AUTH_PASSWORD) {
    return res.status(503).json({ ok: false, error: 'Auth not configured on server.' });
  }

  if (!safeEqual(username, AUTH_USER) || !safeEqual(password, AUTH_PASSWORD)) {
    return res.status(401).json({ ok: false, error: 'Usuario o contrasena incorrectos.' });
  }

  setSession(res, username);
  const redirect = req.body.next && String(req.body.next).startsWith('/') ? req.body.next : '/hub';
  return res.json({ ok: true, redirect });
});

app.post('/api/logout', (req, res) => {
  clearSession(res);
  return res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const session = verifyToken(req.cookies[SESSION_COOKIE]);
  if (!session) return res.status(401).json({ ok: false });
  return res.json({ ok: true, user: session.u });
});

app.get('/', (req, res) => {
  if (isAuthed(req)) return res.redirect('/hub');
  return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/hub', requireAuth, (req, res) => {
  return res.sendFile(path.join(PUBLIC_DIR, 'hub.html'));
});

app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets')));
app.use('/css', express.static(path.join(PUBLIC_DIR, 'css')));
app.use('/js', express.static(path.join(PUBLIC_DIR, 'js')));

app.use('/deck', requireAuth, express.static(path.join(PUBLIC_DIR, 'deck')));
app.use('/pricing', requireAuth, express.static(path.join(PUBLIC_DIR, 'pricing')));

app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log('Playground running on http://localhost:' + PORT);
});
