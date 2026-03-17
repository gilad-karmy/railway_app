const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;
const BINANCE_BASE = 'https://api.binance.com';
const BYBIT_BASE = 'https://api.bybit.com';

function signBinance(query) {
  return crypto.createHmac('sha256', API_SECRET).update(query).digest('hex');
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Binance balance
app.get('/balance', async (req, res) => {
  const ts = Date.now();
  const query = `timestamp=${ts}`;
  const sig = signBinance(query);
  const r = await fetch(`${BINANCE_BASE}/api/v3/account?${query}&signature=${sig}`, {
    headers: { 'X-MBX-APIKEY': API_KEY }
  });
  const data = await r.json();
  const balances = (data.balances || []).filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
  res.json({ balances });
});

// Binance order
app.post('/order', async (req, res) => {
  const ts = Date.now();
  const params = { ...req.body, timestamp: ts };
  const query = new URLSearchParams(params).toString();
  const sig = signBinance(query);
  const r = await fetch(`${BINANCE_BASE}/api/v3/order?${query}&signature=${sig}`, {
    method: 'POST',
    headers: { 'X-MBX-APIKEY': API_KEY }
  });
  res.json(await r.json());
});

// Bybit balance (proxied to bypass CloudFront geo-block)
app.get('/bybit-balance', async (req, res) => {
  const { accountType, apiKey, timestamp, recvWindow, signature } = req.query;
  const r = await fetch(`${BYBIT_BASE}/v5/account/wallet-balance?accountType=${accountType}`, {
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'X-BAPI-SIGN': signature,
    }
  });
  res.json(await r.json());
});

// Bybit order (proxied to bypass geo-block)
app.post('/bybit-order', async (req, res) => {
  const { path, body, apiKey, timestamp, recvWindow, signature } = req.body;
  const r = await fetch(`${BYBIT_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'X-BAPI-SIGN': signature,
    },
    body: body,
  });
  res.json(await r.json());
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));
