const express = require('express');
const _ = require('lodash');
const minimist = require('minimist');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock hardcoded secret pattern for SAST demo (non-Stripe pattern)
const MOCK_HARDCODED_KEY = "dummy_mock_secret_token_for_sast_test_only";

app.get('/', (req, res) => {
  res.send(`
    <h1>Vulnerable Demo App for Snyk & Jenkins</h1>
    <p>Status: Running</p>
    <ul>
      <li><a href="/status">System Status</a></li>
      <li><a href="/lookup?url=https://httpbin.org/get">URL Lookup (SSRF test endpoint)</a></li>
    </ul>
  `);
});

// Endpoint demonstrating lodash merge pattern (Prototype pollution test surface)
app.post('/api/merge', (req, res) => {
  const target = {};
  // Vulnerable pattern in lodash <= 4.17.15: Object prototype pollution via _.merge
  _.merge(target, req.body);
  res.json({ message: "Payload merged successfully", result: target });
});

// Endpoint demonstrating SSRF surface with axios <= 0.21.1
app.get('/lookup', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Please provide ?url= query parameter");
  }

  try {
    const response = await axios.get(targetUrl, { timeout: 3000 });
    res.json({
      url: targetUrl,
      status: response.status,
      data: response.data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System status
app.get('/status', (req, res) => {
  res.json({
    app: "vulrepo",
    version: "1.0.0",
    nodeVersion: process.version,
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
