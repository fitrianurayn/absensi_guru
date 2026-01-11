import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Pencil,
  Save,
  X,
  ArrowLeft,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';


export default function Absensi() {
  const [adaPerubahan, setAdaPerubahan] = useState(false);
  const [sudahDisimpan, setSudahDisimpan] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [statusHari, setStatusHari] = useState({});
  const [absensiData, setAbsensiData] = useState({});
  const [rekap, setRekap] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const namaBulanIndonesia = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const urlParams = new URLSearchParams(window.location.search);
  const bulan = parseInt(urlParams.get('bulan')) || (new Date().getMonth() + 1);
  const tahun = parseInt(urlParams.get('tahun')) || 2026;
  const jumlahHari = new Date(tahun, bulan, 0).getDate();
  
  console.log(`📅 Halaman Absensi: Bulan ${bulan} (${namaBulanIndonesia[bulan - 1]}) Tahun ${tahun}, ${jumlahHari} hari`);

const API_URL = "https://absensiguru-production-2abf.up.railway.app";

  const handleStatusHariChange = (hari, status) => {
    console.log(`🔄 Ubah status hari ${hari} → ${status}`);
    setStatusHari(prev => ({ ...prev, [hari]: status }));
    setAdaPerubahan(true);
    setSudahDisimpan(false);

    if (status === "LIBUR" || status === "HUJAN") {
      setAbsensiData(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(key => {
          if (key.endsWith(`-${hari}`)) delete copy[key];
        });
        return copy;
      });
    }
  };

  const handleAbsensiChange = (guruId, hari, nilai) => {
    console.log(`✏️ Ubah absensi: guru=${guruId}, hari=${hari}, nilai=${nilai}`);
    setAbsensiData(prev => ({
      ...prev,
      [`${guruId}-${hari}`]: nilai
    }));
    setAdaPerubahan(true);
    setSudahDisimpan(false);
  };

  const simpanPerubahan = async () => {
    setIsLoading(true);
    try {
      if (Object.keys(statusHari).length === 0) {
        alert("Data status hari belum dimuat.");
        setIsLoading(false);
        return;
      }

      console.log("Mulai simpan...");

      // Simpan status hari
      const statusPayload = [];
      for (let i = 1; i <= jumlahHari; i++) {
        statusPayload.push({
          tanggal: i,
          status: statusHari[i] || "AKTIF"
        });
      }

      const statusRes = await fetch(`${API_URL}/api/status-hari/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tahun, bulan, data: statusPayload })
      });

      if (!statusRes.ok) {
        const errorData = await statusRes.json();
        throw new Error(errorData.error || 'Gagal simpan status hari');
      }
      console.log("✅ Status hari tersimpan");

      // Simpan absensi
      const absensiPayload = [];
      Object.keys(absensiData).forEach(key => {
        const [guruId, hari] = key.split('-');
        const hariNum = parseInt(hari);
        const statusHariIni = statusHari[hariNum];

        if (!absensiData[key] || statusHariIni === "LIBUR" || statusHariIni === "HUJAN") {
          return;
        }

        absensiPayload.push({
          guru_id: parseInt(guruId),
          tahun,
          bulan,
          tanggal: hariNum,
          status: absensiData[key]
        });
      });

      for (const item of absensiPayload) {
        const res = await fetch(`${API_URL}/api/absensi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error('Error saving absensi:', errorData);
        }
      }
      console.log("Absensi tersimpan");

      await fetchAbsensi();
      await loadRekap();

      setSudahDisimpan(true);
      setShowToast(true);
      setAdaPerubahan(false);
      setIsEditMode(false);
      setTimeout(() => setShowToast(false), 3000);

    } catch (err) {
      console.error("❌ ERROR:", err);
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKembali = (e) => {
    e.preventDefault();

    if (isLoading) {
      return; // ⛔ jangan lakukan apa pun
    }

    if (adaPerubahan && !sudahDisimpan) {
      setShowModal(true);
    } else {
      window.history.back();
    }
  };


  const renderKolomContent = (hari, guruId) => {
    const statusHariIni = statusHari[hari];
    const nilai = absensiData[`${guruId}-${hari}`];

    if (statusHariIni === "LIBUR") {
      return <span className="text-red-600 font-semibold text-[10px] sm:text-xs">LIBUR</span>;
    }

    if (statusHariIni === "HUJAN") {
      return <span className="text-blue-600 font-semibold text-[10px] sm:text-xs">HUJAN</span>;
    }

    if (isEditMode && statusHariIni === "AKTIF") {
      return (
        <select
          className="border rounded text-[10px] sm:text-xs px-1 sm:px-2 py-1 w-full max-w-[60px]"
          value={nilai || ""}
          onChange={(e) => handleAbsensiChange(guruId, hari, e.target.value)}
        >
          <option value="">--</option>
          <option value="H">H</option>
          <option value="I">I</option>
          <option value="S">S</option>
        </select>
      );
    }

    if (nilai) {
      return (
        <span className={`font-bold text-xs sm:text-sm ${nilai === "H" ? "text-green-600" : "text-red-600"}`}>
          {nilai}
        </span>
      );
    }

    return null;
  };

  const fetchAbsensi = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/absensi/${tahun}/${bulan}`);
      const json = await res.json();
      const data = {};
      json.forEach(item => {
        data[`${item.guru_id}-${item.tanggal}`] = item.status;
      });
      setAbsensiData(data);
      console.log(`✅ Loaded ${json.length} absensi`);
    } catch (err) {
      console.error(err);
    }
  }, [API_URL, tahun, bulan]);


  const loadRekap = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/rekap/${tahun}/${bulan}`);
      const json = await res.json();
      setRekap(json);
    } catch (err) {
      console.error(err);
    }
  }, [API_URL, tahun, bulan]);


  useEffect(() => {
    fetch(`${API_URL}/api/guru`)
      .then(res => res.json())
      .then(data => setGuruList(data))
      .catch(err => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAbsensi();
  }, [fetchAbsensi]);

  useEffect(() => {
    fetch(`${API_URL}/api/status-hari/${tahun}/${bulan}`)
      .then(res => res.json())
      .then(json => {
        const data = {};
        json.forEach(item => {
          data[item.tanggal] = item.status;
        });

        for (let i = 1; i <= jumlahHari; i++) {
          if (!data[i]) data[i] = "AKTIF";
        }

        setStatusHari(data);
        console.log("✅ Loaded status hari:", data);
      })
      .catch(err => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahun, bulan, jumlahHari]);

  useEffect(() => {
    loadRekap();
  }, [loadRekap]);


  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen p-3 sm:p-6 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <button
          onClick={handleKembali}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 bg-white text-gray-700
            px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium
            shadow-sm transition-all duration-300
            ${isLoading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-50 hover:shadow-md hover:-translate-x-1"}
          `}
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl max-w-full overflow-hidden">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-[#ffb000] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg mb-3 sm:mb-4">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-semibold text-base sm:text-lg">{namaBulanIndonesia[bulan - 1]}</span>
            <span className="font-semibold text-base sm:text-lg">{tahun}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📋 Absensi Guru</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Kelola kehadiran guru dengan mudah • {jumlahHari} hari
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-gray-500">
            {isEditMode
              ? "Mode edit AKTIF, jangan lupa simpan perubahan"
              : "Klik edit untuk mengisi absensi"}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {!isEditMode ? (
              <button
                onClick={() => {
                  setIsEditMode(true);
                  setSudahDisimpan(false);
                }}
                className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold
                          bg-blue-100 hover:bg-blue-200 text-blue-700 transition"
              >
                <Pencil className="w-4 h-4" />
                Edit Absensi
              </button>

            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setAdaPerubahan(false);
                  }}
                  className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold
                            bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
                  disabled={isLoading}
                >
                  Batal
                </button>

                <button
                  onClick={simpanPerubahan}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold
                            bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800
                            shadow transition disabled:opacity-50 disabled:cursor-wait"
                >
                  {isLoading ? (
                    <>
                      <Save className="w-4 h-4 animate-pulse" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 -mx-4 sm:mx-0">
          <div className="min-w-max">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0084ff] text-white">
                  <th className="border border-white/20 px-2 sm:px-4 py-2 sm:py-3 sticky left-0 bg-[#0084ff] z-10 min-w-[100px] sm:min-w-[150px] font-semibold text-xs sm:text-sm">
                    Nama Guru
                  </th>
                  {Array.from({ length: jumlahHari }, (_, i) => i + 1).map(hari => (
                    <th key={hari} className="border border-white/20 px-1 sm:px-2 py-2 sm:py-3 font-semibold min-w-[50px] sm:min-w-[60px]">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-xs sm:text-sm">{hari}</span>

                        {isEditMode ? (
                          <select
                            className="border-2 border-white/50 rounded-lg text-[10px] sm:text-xs px-1 sm:px-2 py-1 
                                      bg-white/20 text-white font-medium cursor-pointer
                                      hover:bg-white/30 transition w-full max-w-[70px]"
                            value={statusHari[hari] || "AKTIF"}
                            onChange={(e) => handleStatusHariChange(hari, e.target.value)}
                          >
                            <option value="AKTIF" className="text-gray-700">AKTIF</option>
                            <option value="HUJAN" className="text-gray-700">HUJAN</option>
                            <option value="LIBUR" className="text-gray-700">LIBUR</option>
                          </select>
                        ) : (
                          <span className="text-[8px] sm:text-[10px] font-semibold opacity-80">
                            {statusHari[hari] === "LIBUR" && "LIBUR"}
                            {statusHari[hari] === "HUJAN" && "HUJAN"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {guruList.map((guru, idx) => (
                  <tr
                    key={guru.id}
                    className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-purple-50 transition-all duration-200`}
                  >
                    <td
                      className="border border-gray-200 px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-700 sticky left-0 z-10 min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm"
                      style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#ffffff' }}
                    >
                      {guru.nama}
                    </td>
                    {Array.from({ length: jumlahHari }, (_, i) => i + 1).map(hari => (
                      <td key={hari} className="border border-gray-200 px-1 sm:px-2 py-2 sm:py-3 text-center min-w-[50px] sm:min-w-[60px]">
                        {renderKolomContent(hari, guru.id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-5 rounded-xl shadow">
          <h3 className="font-bold text-gray-700 mb-3 text-sm sm:text-base">Rekap Kehadiran</h3>

          {rekap.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400">Data guru belum dimuat</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-max sm:max-w-md px-4 sm:px-0">
                <table className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold">Nama</th>
                      <th className="px-2 py-2 text-center font-semibold text-green-600">Hadir</th>
                      <th className="px-2 py-2 text-center font-semibold text-red-600">Izin</th>
                      <th className="px-2 py-2 text-center font-semibold text-red-600">Sakit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekap.map((item) => (
                      <tr key={item.guru_id} className="border-t hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 font-medium text-gray-700 truncate max-w-[120px] sm:max-w-none">{item.nama}</td>
                        <td className="px-2 py-2 text-center text-green-600 font-semibold">{item.hadir}</td>
                        <td className="px-2 py-2 text-center text-red-600 font-semibold">{item.izin}</td>
                        <td className="px-2 py-2 text-center text-red-600 font-semibold">{item.sakit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`fixed top-4 sm:top-6 right-4 sm:right-6 left-4 sm:left-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 z-50 transition-all duration-300 ${
          showToast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="bg-white/30 p-1 rounded-full">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span className="font-semibold text-xs sm:text-base">Perubahan berhasil disimpan!</span>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-yellow-100 rounded-full mb-3 sm:mb-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Peringatan!</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">Perubahan Anda belum disimpan. Yakin ingin kembali?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <X className="w-4 h-4" />
                  Batal
                </button>

                <button
                  onClick={() => {
                    setIsLoading(false);
                    setAdaPerubahan(false);
                    setShowModal(false);
                    window.history.back();
                  }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold transition-all text-sm sm:text-base"
                >
                  Ya, Kembali
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}