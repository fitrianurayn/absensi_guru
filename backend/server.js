const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

/* =======================
   MIDDLEWARE
======================= */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "absensi-guru-delta.vercel.app",
      "https://*.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log("API HIT:", req.method, req.url);
  next();
});

/* =======================
   DATABASE (Supabase Postgres)
======================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* =======================
   HEALTH CHECK
======================= */
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend Absensi Guru Running" });
});

/* =======================
   ROUTES GURU
======================= */
app.get("/api/guru", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM guru ORDER BY nama");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guru:", error);
    res.status(500).json({ error: "Error fetching guru data" });
  }
});

app.post("/api/guru", async (req, res) => {
  const { nama } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO guru (nama) VALUES ($1) RETURNING *",
      [nama]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding guru:", error);
    res.status(500).json({ error: "Error adding guru" });
  }
});

/* =======================
   STATUS HARI
======================= */
app.get("/api/status-hari/:tahun/:bulan", async (req, res) => {
  const { tahun, bulan } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM status_hari WHERE tahun = $1 AND bulan = $2 ORDER BY tanggal",
      [tahun, bulan]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching status hari:", error);
    res.status(500).json({ error: "Error fetching status hari" });
  }
});

app.post("/api/status-hari", async (req, res) => {
  const { tahun, bulan, tanggal, status } = req.body;
  const statusUpper = status.toUpperCase();

  if (!["AKTIF", "HUJAN", "LIBUR"].includes(statusUpper)) {
    return res
      .status(400)
      .json({ error: "Status harus AKTIF, HUJAN, atau LIBUR" });
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
    console.error("Error setting status hari:", error);
    res.status(500).json({ error: "Error setting status hari" });
  }
});

app.post("/api/status-hari/bulk", async (req, res) => {
  const { tahun, bulan, data } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const item of data) {
      const statusUpper = item.status.toUpperCase();

      if (!["AKTIF", "HUJAN", "LIBUR"].includes(statusUpper)) {
        throw new Error("Status tidak valid");
      }

      await client.query(
        `INSERT INTO status_hari (tahun, bulan, tanggal, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tahun, bulan, tanggal)
         DO UPDATE SET status = $4`,
        [tahun, bulan, item.tanggal, statusUpper]
      );

      if (["LIBUR", "HUJAN"].includes(statusUpper)) {
        await client.query(
          `DELETE FROM absensi
           WHERE tahun = $1 AND bulan = $2 AND tanggal = $3`,
          [tahun, bulan, item.tanggal]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Bulk status hari berhasil" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =======================
   ABSENSI
======================= */
app.get("/api/absensi/:tahun/:bulan", async (req, res) => {
  const { tahun, bulan } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM absensi WHERE tahun = $1 AND bulan = $2",
      [tahun, bulan]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching absensi" });
  }
});

app.post("/api/absensi", async (req, res) => {
  const { guru_id, tahun, bulan, tanggal, status } = req.body;

  if (!["H", "I", "S"].includes(status)) {
    return res.status(400).json({ error: "Status harus H, I, atau S" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO absensi (guru_id, tahun, bulan, tanggal, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (guru_id, tahun, bulan, tanggal)
       DO UPDATE SET status = $5
       RETURNING *`,
      [guru_id, tahun, bulan, tanggal, status]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error saving absensi" });
  }
});

/* =======================
   REKAP
======================= */
app.get("/api/rekap/:tahun/:bulan", async (req, res) => {
  const { tahun, bulan } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT 
        g.id AS guru_id, g.nama,
        COUNT(CASE WHEN a.status = 'H' THEN 1 END) AS hadir,
        COUNT(CASE WHEN a.status = 'I' THEN 1 END) AS izin,
        COUNT(CASE WHEN a.status = 'S' THEN 1 END) AS sakit
      FROM guru g
      LEFT JOIN absensi a
        ON g.id = a.guru_id
        AND a.tahun = $1
        AND a.bulan = $2
      GROUP BY g.id, g.nama
      ORDER BY g.nama
      `,
      [tahun, bulan]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil rekap absensi" });
  }
});

/* =======================
   START SERVER (Development only)
======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Absensi Guru running on port ${PORT}`);
});

