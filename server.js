const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serves everything inside the "public" folder automatically
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./signups.db');

db.run(`CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT NOT NULL
)`);

app.get('/api/signups', (req, res) => {
  db.all('SELECT * FROM signups ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/signups', (req, res) => {
  const { name, status } = req.body;
  db.run('INSERT INTO signups (name, status) VALUES (?, ?)', [name, status], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, status });
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));