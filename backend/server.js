const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// Logging middleware
app.use((req, res, next) => {
  console.log('API HIT:', req.method, req.url);
  next();
});

// ========== ROUTES ========== (semua route Anda tetap sama)

app.get('/api/guru', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guru ORDER BY nama');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching guru:', error);
    res.status(500).json({ error: 'Error fetching guru data' });
  }
});

app.post('/api/guru', async (req, res) => {
  const { nama } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO guru (nama) VALUES ($1) RETURNING *',
      [nama]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding guru:', error);
    res.status(500).json({ error: 'Error adding guru' });
  }
});

app.get('/api/status-hari/:tahun/:bulan', async (req, res) => {
  const { tahun, bulan } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM status_hari WHERE tahun = $1 AND bulan = $2 ORDER BY tanggal',
      [tahun, bulan]
    );
    console.log(`✅ Fetched ${result.rows.length} status hari for ${tahun}-${bulan}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching status hari:', error);
    res.status(500).json({ error: 'Error fetching status hari' });
  }
});

app.post('/api/status-hari', async (req, res) => {
  const { tahun, bulan, tanggal, status } = req.body;
  const statusUpper = status.toUpperCase();
  if (!['AKTIF', 'HUJAN', 'LIBUR'].includes(statusUpper)) {
    return res.status(400).json({ error: 'Status harus AKTIF, HUJAN, atau LIBUR' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO status_hari (tahun, bulan, tanggal, status) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (tahun, bulan, tanggal) 
       DO UPDATE SET status = $4 
       RETURNING *`,
      [tahun, bulan, tanggal, statusUpper]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error setting status hari:', error);
    res.status(500).json({ error: 'Error setting status hari' });
  }
});

app.post("/api/status-hari/bulk", async (req, res) => {
  const { tahun, bulan, data } = req.body;
  console.log(`📥 Menerima bulk status hari: tahun=${tahun}, bulan=${bulan}, jumlah=${data.length}`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of data) {
      const { tanggal, status } = item;
      const statusUpper = status.toUpperCase();
      if (!['AKTIF', 'HUJAN', 'LIBUR'].includes(statusUpper)) {
        throw new Error(`Status tidak valid: ${status}`);
      }
      await client.query(
        `INSERT INTO status_hari (tahun, bulan, tanggal, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tahun, bulan, tanggal)
         DO UPDATE SET status = $4`,
        [tahun, bulan, tanggal, statusUpper]
      );
      if (statusUpper === 'LIBUR' || statusUpper === 'HUJAN') {
        const deleteResult = await client.query(
          `DELETE FROM absensi WHERE tahun = $1 AND bulan = $2 AND tanggal = $3`,
          [tahun, bulan, tanggal]
        );
        console.log(`🗑️ Hapus ${deleteResult.rowCount} absensi untuk tanggal ${tanggal} (${statusUpper})`);
      }
    }
    await client.query("COMMIT");
    console.log("✅ Bulk status hari berhasil disimpan");
    res.json({ message: "Status hari & absensi tersinkron", count: data.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error bulk status hari:", err);
    res.status(500).json({ error: "Gagal simpan status hari: " + err.message });
  } finally {
    client.release();
  }
});

app.get('/api/absensi/:tahun/:bulan', async (req, res) => {
  const { tahun, bulan } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM absensi WHERE tahun = $1 AND bulan = $2',
      [tahun, bulan]
    );
    console.log(`✅ Fetched ${result.rows.length} absensi for ${tahun}-${bulan}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching absensi:', error);
    res.status(500).json({ error: 'Error fetching absensi' });
  }
});

app.post('/api/absensi', async (req, res) => {
  const { guru_id, tahun, bulan, tanggal, status } = req.body;
  console.log(`📝 Simpan absensi: guru=${guru_id}, tanggal=${tanggal}, status=${status}`);
  if (!['H', 'I', 'S'].includes(status)) {
    return res.status(400).json({ error: 'Status harus H, I, atau S' });
  }
  try {
    const cekHari = await pool.query(
      `SELECT status FROM status_hari WHERE tahun = $1 AND bulan = $2 AND tanggal = $3`,
      [tahun, bulan, tanggal]
    );
    if (cekHari.rows.length > 0) {
      const statusHari = cekHari.rows[0].status;
      if (statusHari === 'LIBUR' || statusHari === 'HUJAN') {
        console.log(`❌ Ditolak: hari ${tanggal} berstatus ${statusHari}`);
        return res.status(400).json({
          error: `Tidak bisa mengisi absensi di hari ${statusHari}`
        });
      }
    }
    const result = await pool.query(
      `INSERT INTO absensi (guru_id, tahun, bulan, tanggal, status) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (guru_id, tahun, bulan, tanggal) 
       DO UPDATE SET status = $5 
       RETURNING *`,
      [guru_id, tahun, bulan, tanggal, status]
    );
    console.log(`✅ Absensi tersimpan`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error saving absensi:', error);
    res.status(500).json({ error: 'Error saving absensi: ' + error.message });
  }
});

app.get('/api/rekap/:tahun/:bulan', async (req, res) => {
  const { tahun, bulan } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        g.id AS guru_id, g.nama,
        COUNT(CASE WHEN a.status = 'H' THEN 1 END) AS hadir,
        COUNT(CASE WHEN a.status = 'I' THEN 1 END) AS izin,
        COUNT(CASE WHEN a.status = 'S' THEN 1 END) AS sakit
      FROM guru g
      LEFT JOIN absensi a ON g.id = a.guru_id AND a.tahun = $1 AND a.bulan = $2
      GROUP BY g.id, g.nama
      ORDER BY g.nama
    `, [tahun, bulan]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rekap:', err);
    res.status(500).json({ error: 'Gagal mengambil rekap absensi' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Export untuk Vercel (serverless)
module.exports = app;