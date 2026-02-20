const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'libreria.db');

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── Helpers sql.js ───────────────────────────────────────────────────────────
let db;

// Serializza il DB in memoria su disco dopo ogni scrittura
function saveDb() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

// Esegue una SELECT e restituisce tutti i risultati come array di oggetti
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Esegue una SELECT e restituisce il primo risultato (o null)
function queryOne(sql, params = []) {
  return queryAll(sql, params)[0] ?? null;
}

// Esegue INSERT / UPDATE / DELETE, salva su disco, ritorna le righe modificate
function run(sql, params = []) {
  db.run(sql, params);
  const changes = db.getrowsmodified();
  saveDb();
  return changes;
}

// ─── API REST ─────────────────────────────────────────────────────────────────

// GET /api/books — lista tutti i libri
app.get('/api/books', (req, res) => {
  res.json(queryAll('SELECT * FROM books ORDER BY created_at ASC'));
});

// POST /api/books — aggiungi un libro
app.post('/api/books', (req, res) => {
  const { id, title, author, status, note, cover, link, comment, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Titolo obbligatorio' });

  const bookId = id || Date.now().toString();
  run(
    'INSERT INTO books (id, title, author, status, note, cover, link, comment, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [bookId, title, author || '', status || 'toread', note || '', cover || '', link || '', comment || '', tags || '']
  );

  res.status(201).json(queryOne('SELECT * FROM books WHERE id = ?', [bookId]));
});

// PUT /api/books/:id — aggiorna un libro
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const existing = queryOne('SELECT * FROM books WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Libro non trovato' });

  const { title, author, status, note, cover, link, comment, tags } = req.body;
  run(
    'UPDATE books SET title=?, author=?, status=?, note=?, cover=?, link=?, comment=?, tags=? WHERE id=?',
    [
      title   ?? existing.title,
      author  ?? existing.author,
      status  ?? existing.status,
      note    ?? existing.note,
      cover   ?? existing.cover,
      link    ?? existing.link,
      comment ?? existing.comment,
      tags    ?? existing.tags,
      id
    ]
  );

  res.json(queryOne('SELECT * FROM books WHERE id = ?', [id]));
});

// DELETE /api/books/:id — elimina un libro
app.delete('/api/books/:id', (req, res) => {
  const changes = run('DELETE FROM books WHERE id = ?', [req.params.id]);
  if (changes === 0) return res.status(404).json({ error: 'Libro non trovato' });
  res.json({ success: true });
});

// POST /api/books/migrate — importazione bulk da localStorage (una sola volta)
app.post('/api/books/migrate', (req, res) => {
  const { books } = req.body;
  if (!Array.isArray(books)) return res.status(400).json({ error: 'books deve essere un array' });

  db.run('BEGIN');
  let count = 0;
  for (const b of books) {
    if (!b.title) continue;
    db.run(
      'INSERT OR IGNORE INTO books (id, title, author, status, note, cover, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [b.id || Date.now().toString(), b.title, b.author || '', b.status || 'toread', b.note || '', b.cover || '', b.link || '']
    );
    count++;
  }
  db.run('COMMIT');
  saveDb();

  console.log(`Migrazione localStorage: ${count} libri importati.`);
  res.json({ migrated: count });
});

// POST /api/books/reset — cancella tutti i libri
app.post('/api/books/reset', (req, res) => {
  run('DELETE FROM books');
  res.json({ success: true });
});

// ─── Avvio asincrono (sql.js richiede init WASM) ─────────────────────────────
async function start() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('Database esistente caricato.');
  } else {
    db = new SQL.Database();
    console.log('Nuovo database creato.');
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id         TEXT PRIMARY KEY,
      title      TEXT    NOT NULL,
      author     TEXT    DEFAULT '',
      status     TEXT    DEFAULT 'toread',
      note       TEXT    DEFAULT '',
      cover      TEXT    DEFAULT '',
      link       TEXT    DEFAULT '',
      comment    TEXT    DEFAULT '',
      tags       TEXT    DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Migrazione incrementale: aggiunge colonne a DB esistenti che ne erano privi
  try { db.run("ALTER TABLE books ADD COLUMN comment TEXT DEFAULT ''"); } catch(_) {}
  try { db.run("ALTER TABLE books ADD COLUMN tags    TEXT DEFAULT ''"); } catch(_) {}
  saveDb();

  app.listen(PORT, () => {
    console.log(`\n  Libreria avviata su  http://localhost:${PORT}`);
    console.log(`  Database:            libreria.db`);
    console.log(`  Per la ricerca:      python server.py  (porta 5000)\n`);
  });
}

start().catch(err => {
  console.error('Errore avvio server:', err);
  process.exit(1);
});
