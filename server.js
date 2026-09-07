const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
const dbPath = path.join(__dirname, 'signups.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Ensure database table matches the scheduling structure
db.run(`CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_key TEXT NOT NULL,
  slot_time TEXT NOT NULL,
  player_name TEXT NOT NULL
)`);

// Endpoint: Fetch all active signups
app.get('/api/signups', (req, res) => {
  db.all('SELECT * FROM signups', [], (err, rows) => {
    if (err) {
      console.error('Error fetching signups:', err.message);
      return res.status(500).json({ error: err.message });
    }
    
    const structuredData = {};
    rows.forEach(row => {
      if (!structuredData[row.date_key]) structuredData[row.date_key] = {};
      if (!structuredData[row.date_key][row.slot_time]) structuredData[row.date_key][row.slot_time] = [];
      structuredData[row.date_key][row.slot_time].push(row.player_name);
    });

    res.json(structuredData);
  });
});

// Endpoint: Save new slot signups
app.post('/api/signups', (req, res) => {
  const { dateKey, slots, name } = req.body;
  if (!dateKey || !slots || !name || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'Missing required signup fields or no slots selected.' });
  }

  const stmt = db.prepare('INSERT INTO signups (date_key, slot_time, player_name) VALUES (?, ?, ?)');
  let completed = 0;
  let hasError = false;

  slots.forEach(slot => {
    stmt.run(dateKey, slot, name, (err) => {
      if (err && !hasError) {
        hasError = true;
        console.error('Insert error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      completed++;
      if (completed === slots.length && !hasError) {
        stmt.finalize();
        res.json({ success: true });
      }
    });
  });
});

// Admin: Delete single signup
app.delete('/api/signups', (req, res) => {
  const { dateKey, slot, name } = req.body;
  db.run('DELETE FROM signups WHERE date_key = ? AND slot_time = ? AND player_name = ?', [dateKey, slot, name], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Admin: Clear specific day
app.delete('/api/signups/day', (req, res) => {
  const { dateKey } = req.body;
  db.run('DELETE FROM signups WHERE date_key = ?', [dateKey], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Ultra Admin: Clear entire database
app.delete('/api/signups/all', (req, res) => {
  db.run('DELETE FROM signups', [], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));