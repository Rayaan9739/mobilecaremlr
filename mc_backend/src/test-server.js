const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors({ origin: true, credentials: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mode: 'Test Server' });
});

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Test Server running on port ${PORT}`);
});
