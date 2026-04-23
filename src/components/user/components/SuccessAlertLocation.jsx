import React from "react";

const SuccessAlertLocation = ({ message, coordinates }) => {
    return (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg 
                        className="h-6 w-6 text-green-500" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="font-bold text-green-800">{message}</p>
                    {coordinates && (
                        <div className="mt-2">
                            <p className="text-sm text-green-700 font-medium">Koordinat:</p>
                            <p className="text-xs font-mono bg-green-50 p-2 rounded mt-1 border border-green-200">
                                {coordinates}
                            </p>
                        </div>
                    )}
                    <div className="mt-3">
                        <div className="w-full bg-green-200 rounded-full h-1">
                            <div className="bg-green-500 h-1 rounded-full animate-progress"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                
                .animate-progress {
                    animation: progress 3s linear forwards;
                }
            `}</style>
        </div>
    );
};

export default SuccessAlertLocation;