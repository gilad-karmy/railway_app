const express = require('express'); const crypto = require('crypto'); const axios = require('axios'); const app = express(); app.use(express.json());

const API_KEY = process.env.BINANCE_API_KEY; const API_SECRET = process.env.BINANCE_API_SECRET; const BASE = 'https://api.binance.com';

function sign(query) { return crypto.createHmac('sha256', API_SECRET).update(query).digest('hex'); }

app.use((req, res, next) => { res.header('Access-Control-Allow-Origin', ''); res.header('Access-Control-Allow-Headers', ''); if (req.method === 'OPTIONS') return res.sendStatus(200); next(); });

app.get('/balance', async (req, res) => { try { const ts = Date.now(); const query = `timestamp=${ts}`; const sig = sign(query); const r = await axios.get(`${BASE}/api/v3/account?${query}&signature=${sig}`, { headers: { 'X-MBX-APIKEY': API_KEY } }); res.json(r.data); } catch (e) { res.status(500).json({ error: e.message }); } });

app.post('/order', async (req, res) => { try { const ts = Date.now(); const params = { ...req.body, timestamp: ts }; const query = new URLSearchParams(params).toString(); const sig = sign(query); const r = await axios.post(`${BASE}/api/v3/order?${query}&signature=${sig}`, {}, { headers: { 'X-MBX-APIKEY': API_KEY } }); res.json(r.data); } catch (e) { res.status(500).json({ error: e.message }); } });

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));