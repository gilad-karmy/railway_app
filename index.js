const express = require('express');
const crypto = require('crypto');
const https = require('https');
const app = express();
app.use(express.json());

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;
const BASE = 'https://api.binance.com';

function sign(query) {
  return crypto.createHmac('sha256', API_SECRET).update(query).digest('hex');
}

async function binanceFetch(path, method = 'GET', params = {}) {
  const ts = Date.now();
  const allParams = { ...params, timestamp: ts };
  const query = new URLSearchParams(allParams).toString();
  const sig = sign(query);
  const url = `${BASE}${path}?${query}&signature=${sig}`;
  
  const res = await fetch(url, {
    method,
    headers: { 'X-MBX-APIKEY': API_KEY }
  });
  return res.json();
}

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/balance', async (req, res) => {
  try {
    const data = await binanceFetch('/api/v3/account');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/order', async (req, res) => {
  try {
    const data = await binanceFetch('/api/v3/order', 'POST', req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/order', async (req, res) => {
  try {
    const data = await binanceFetch('/api/v3/order', 'DELETE', req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/openOrders', async (req, res) => {
  try {
    const data = await binanceFetch('/api/v3/openOrders', 'GET', req.query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Proxy running on port', process.env.PORT || 3000));
