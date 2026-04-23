import { APP_VERSION } from '../../SetupVersion';

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 px-6 md:px-12 py-10 text-slate-900">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src="/logo_new.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex flex-col text-left">
            <h1 className="text-slate-800 text-[16px] font-bold tracking-wide leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>
              Route Modelling <span className="text-blue-600">App</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
              Intelligence Supply & Interplatform
            </p>
          </div>
        </div>

        <div className="text-center md:text-right">
          <p className="text-[13px] text-slate-500 mb-2 font-medium">
            &copy; {new Date().getFullYear()} All Rights Reserved.
          </p>
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              Build Version <span className="text-slate-900 ml-1">{APP_VERSION}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;