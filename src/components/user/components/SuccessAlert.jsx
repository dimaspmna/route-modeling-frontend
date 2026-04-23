import React, { useEffect } from 'react';

const SuccessAlert = ({ message = "Request berhasil dikirim, silahkan menunggu informasi selanjutnya dari tim fleet" }) => {
    useEffect(() => {
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-60 z-50 backdrop-blur-sm animate-fadeIn">
            <div className="relative flex flex-col items-center bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 animate-scaleIn">
                {/* Animated checkmark */}
                <div className="relative mb-6">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-12 h-12 text-green-600 animate-drawCheckmark"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
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
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    onClick={() => window.location.reload()}
                >
                    Lanjutkan
                </button>

                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full opacity-20 animate-bounceSlow"></div>
                <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-green-400 rounded-full opacity-30 animate-bounceSlowReverse"></div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCheckmark {
          0% { stroke-dasharray: 50; stroke-dashoffset: 50; }
          100% { stroke-dasharray: 50; stroke-dashoffset: 0; }
        }
        @keyframes pingSlow {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounceSlowReverse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .animate-drawCheckmark {
          animation: drawCheckmark 0.5s ease-out forwards;
          animation-delay: 0.2s;
        }
        .animate-pingSlow {
          animation: pingSlow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-bounceSlow {
          animation: bounceSlow 3s ease-in-out infinite;
        }
        .animate-bounceSlowReverse {
          animation: bounceSlowReverse 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>
        </div>
    );
};

export default SuccessAlert;