import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessAlertFw = ({ message = "Data berhasil diperbarui!", onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        if (onClose) onClose();
        window.location.reload(); // 🔄 refresh halaman setelah alert ditutup
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-60 z-50 backdrop-blur-sm animate-fadeIn">
            <div className="relative flex flex-col items-center bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 animate-scaleIn">
                {/* Animated checkmark */}
                <div className="relative mb-6">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    {/* Animated circles */}
                    <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-pingSlow opacity-75"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-green-100 animate-pulse"></div>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Berhasil!</h2>
                <p className="text-gray-600 text-center mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Continue button */}
                <button
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    onClick={handleClose}
                >
                    Tutup
                </button>

                <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes pingSlow {
            0% { transform: scale(1); opacity: 1; }
            75%, 100% { transform: scale(2); opacity: 0; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
          .animate-scaleIn {
            animation: scaleIn 0.3s ease-out forwards;
          }
          .animate-pingSlow {
            animation: pingSlow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
            </div>
        </div>
    );
};

export default SuccessAlertFw;
