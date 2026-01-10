-- Table untuk data guru
CREATE TABLE guru (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table untuk status hari (GUNAKAN UPPERCASE)
CREATE TABLE status_hari (
  id SERIAL PRIMARY KEY,
  tahun INTEGER NOT NULL,
  bulan INTEGER NOT NULL,
  tanggal INTEGER NOT NULL,
  status VARCHAR(20) CHECK (status IN ('AKTIF', 'HUJAN', 'LIBUR')) NOT NULL DEFAULT 'AKTIF',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tahun, bulan, tanggal)
);

-- Table untuk absensi
CREATE TABLE absensi (
  id SERIAL PRIMARY KEY,
  guru_id INTEGER REFERENCES guru(id) ON DELETE CASCADE,
  tahun INTEGER NOT NULL,
  bulan INTEGER NOT NULL,
  tanggal INTEGER NOT NULL,
  status VARCHAR(10) CHECK (status IN ('H', 'I', 'S')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guru_id, tahun, bulan, tanggal)
);

-- Insert data guru awal
INSERT INTO guru (nama) VALUES 
    ('Uss Aviva'),
    ('Ust Fakhrudin'),
    ('Uss Lailul'),
    ('Uss Mita'),
    ('Uss Nada'),
    ('Uss Pipit')
    ('Uss Putri'),
    ('Uss Safa'),
    ('Uss Syehrin'),
    ('Uss Miranti');

-- Index untuk performa
CREATE INDEX idx_status_hari_date ON status_hari(tahun, bulan, tanggal);
CREATE INDEX idx_absensi_date ON absensi(tahun, bulan, tanggal);
CREATE INDEX idx_absensi_guru ON absensi(guru_id);

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_absensi_updated_at 
  BEFORE UPDATE ON absensi 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- PENTING: Jika tabel sudah ada, jalankan ini untuk update data lama:
-- UPDATE status_hari SET status = UPPER(status);