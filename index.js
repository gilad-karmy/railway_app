const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

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
  
  const res = await axios({ method, url, headers: { 'X-MBX-APIKEY': API_KEY } });
  return res.data;
}

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/balance', async (req, res) => {
  try {
    const data = await binanceFetch('/api/v3/account');
    res.json(data);
  } catch (e) {
    res.status(500).json({ 
      error: e.message, 
      details: e.response?.data,
      status: e.response?.status
    });
  }
});

app.post('/order', async (req, res) => {
  try {
    const data = await binanceFetch('/api/v3/order', 'POST', req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ 
      error: e.message, 
      details: e.response?.data,
      status: e.response?.status
    });
  }
});

app.delete('/order', async (req, res) => {
  try {
    const data = await binanceFetch('/api/v3/order', 'DELETE', req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ 
      error: e.message, 
      details: e.response?.data,
      status: e.response?.status
    });
  }
});

app.get('/openOrders', async (req, res) => {
  try {
    const data = await binanceFetch('/api/v3/openOrders', 'GET', req.query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ 
      error: e.message, 
      details: e.response?.data,
      status: e.response?.status
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
