const express = require('express');
const app = express();
app.get('/api/v1', (req, res) => res.json({ message: "Hello dari Node.js API (Al-Quran Text)" }));
app.listen(3000, () => console.log('Node running on port 3000'));