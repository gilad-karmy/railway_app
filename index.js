const express = require('express');
const app = express();

const PROXY_SECRET = process.env.PROXY_SECRET || 'spot7&kok';

app.use(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth
  const token = req.headers['x-proxy-token'];
  if (token !== PROXY_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  // Forward to Bybit
  const bybitUrl = `https://api.bybit.com${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
  
  const headers = { ...req.headers };
  delete headers['host'];
  delete headers['x-proxy-token'];

  const fetchOptions = { method: req.method, headers };
  if (['POST', 'PUT'].includes(req.method)) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    fetchOptions.body = Buffer.concat(chunks);
  }

  const response = await fetch(bybitUrl, fetchOptions);
  const data = await response.text();
  res.status(response.status).send(data);
});

app.listen(process.env.PORT || 3000);
