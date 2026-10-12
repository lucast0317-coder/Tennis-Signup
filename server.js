const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Initialize database schema
db.run(`
  CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date_key TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API: Get all signups grouped by date and slot
app.get('/api/signups', (req, res) => {
  db.all('SELECT * FROM signups', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const grouped = {};
    rows.forEach(row => {
      if (!grouped[row.date_key]) {
        grouped[row.date_key] = {};
      }
      if (!grouped[row.date_key][row.time_slot]) {
        grouped[row.date_key][row.time_slot] = [];
      }
      grouped[row.date_key][row.time_slot].push({ id: row.id, name: row.name });
    });
    res.json(grouped);
  });
});

// API: Save new signups
app.post('/api/signups', (req, res) => {
  const { dateKey, slots, name } = req.body;
  if (!dateKey || !Array.isArray(slots) || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stmt = db.prepare('INSERT INTO signups (name, date_key, time_slot) VALUES (?, ?, ?)');
  db.serialize(() => {
    slots.forEach(slot => {
      stmt.run(name, dateKey, slot);
    });
    stmt.finalize(err => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });
});

// API: Remove a signup
app.delete('/api/signups', (req, res) => {
  const { dateKey, slot, name } = req.body;
  if (!dateKey || !slot || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run('DELETE FROM signups WHERE date_key = ? AND time_slot = ? AND name = ?', [dateKey, slot, name], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, changes: this.changes });
  });
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});