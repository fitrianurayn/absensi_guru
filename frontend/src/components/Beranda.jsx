import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Info } from 'lucide-react';

export default function Beranda() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];


  useEffect(() => {
    // Add stagger animation to buttons
    const buttons = document.querySelectorAll('.bulan-btn');
    buttons.forEach((btn, index) => {
      btn.style.animation = `fadeInUp 0.6s ease-out ${index * 0.05}s backwards`;
    });
  }, []);

  // ✅ PERBAIKAN: Kirim nomor bulan (1-12), bukan index (0-11)
  const pilihBulan = (index) => {
    setLoading(true);

    const nomorBulan = index + 1;
    navigate(`/absensi?bulan=${nomorBulan}&tahun=2026`);
  };


  return (
    <div className="bg-[#f7f9ff] from-blue-50 via-purple-50 to-pink-50 min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .bulan-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .bulan-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: #0084ff;
          transform: translate(-50%, -50%);
          transition: width 0.4s ease, height 0.4s ease;
          z-index: 0;
        }
        
        .bulan-btn:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .bulan-btn span {
          position: relative;
          z-index: 1;
        }
        
        .bulan-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
          border-color: transparent;
        }
        
        .bulan-btn:hover span {
          color: white;
        }
        
        .bulan-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .primary-text {
          color: #000831;
        }

        
        .card-gradient {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
          backdrop-filter: blur(10px);
        }
      `}</style>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
      <div className="absolute top-40 right-10 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-10 left-1/2 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="card-gradient p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full relative z-10 animate-fade-in-up border border-white/50">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-purple-600 font-semibold text-sm sm:text-base">Memuat...</p>
            </div>
          </div>
        )}

        {/* Header dengan Icon */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-5 md:mb-6 animate-float">
            <img
              src="../gambar.png"
              alt="Dokumen"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
            />
          </div>


          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-[#0084ff]">
            <span className="gradient-text">Selamat Datang</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4">
            Pilih bulan untuk mengisi absensi guru
          </p>
          
          {/* Year Badge */}
          <div className="inline-flex items-center gap-2 mt-3 sm:mt-4 bg-[#ffb000] from-purple-500 to-blue-600 text-white px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full shadow-lg text-sm sm:text-base">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-semibold">Tahun Ajaran 2026</span>
          </div>
        </div>

        {/* Grid Bulan */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {namaBulan.map((bulan, index) => (
            <button
              key={index}
              onClick={() => pilihBulan(index)}
              disabled={loading}
              className="
              bulan-btn
              border-2 border-slate-200 text-slate-700
              rounded-xl sm:rounded-2xl

              h-20 sm:h-24 md:h-28        /* MOBILE & TABLET */
              lg:h-auto
              lg:py-5                    /* DESKTOP */

              font-bold
              text-sm sm:text-base md:text-lg
              w-full
              flex items-center justify-center
              "
            >
              <span>{bulan}</span>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-6 sm:mt-8 md:mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 text-xs sm:text-sm bg-white/60 px-4 sm:px-5 md:px-6 py-2 sm:py-3 rounded-full shadow-sm">
            <Info className="w-3 h-3 sm:w-4 sm:h-4 text-[#0084ff]" />
            <span>Klik bulan untuk mulai mengisi absensi</span>
          </div>
        </div>
      </div>
    </div>
  );
}