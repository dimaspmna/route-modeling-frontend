import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Footer from '../../containers/footer/Footer';

const Welcome = () => {
  const stats = [
    { value: '24', suffix: '/7', label: 'Monitoring' },
    { value: '48', suffix: '+', label: 'Active Routes' },
    { value: '12', suffix: '+', label: 'Platforms' },
    { value: '99', suffix: '%', label: 'Accuracy' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <div
        className="relative flex-1 flex flex-col overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(37,99,235,0.05) 0%, transparent 80%), #f8fafc',
        }}
      >
        {/* Garis Aksen - Lebih soft untuk light mode */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none" />

        {/* --- Navbar --- */}
        <nav className="relative z-50 flex justify-between items-center px-6 md:px-12 py-5 md:py-7 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-200">
              <img 
                src="/logo_new.jpeg" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-800 text-sm md:text-[15px] tracking-wide leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>
                Route Modelling
              </span>
              <span className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-medium">
                Supply & Interplatform
              </span>
            </div>
          </div>

          <a
            href="./login"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-[13px] font-semibold px-5 md:px-6 py-2 md:py-2.5 rounded-md transition-all active:scale-95 shadow-md shadow-blue-200"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            LOGIN
          </a>
        </nav>

        {/* --- Hero Content --- */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-12 py-20">
          <div className="max-w-3xl w-full text-center flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded px-3 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] md:text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                Vessel Route Intelligence
              </span>
            </div>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Route <span className="text-blue-600">Modelling</span>
            </h1>

            <p
              className="text-xl md:text-2xl font-medium text-slate-400 tracking-tight mb-8"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Supply and Interplatform
            </p>

            <div className="w-16 h-1.5 bg-blue-600 rounded-full mb-8" />

            <p className="text-sm md:text-[17px] leading-relaxed text-slate-600 font-medium max-w-2xl mb-12">
              Platform pemodelan rute untuk supply vessel dan interplatform boat,
              dirancang untuk efisiensi operasional dan presisi navigasi antar platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <a
                href="./login"
                className="w-full hidden sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-12 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                MASUK KE PLATFORM
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Welcome;