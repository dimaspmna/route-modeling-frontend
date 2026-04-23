import React, { useEffect } from "react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

const SuccessAlertSA = ({ message = "Data berhasil disimpan!", onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onClose) onClose();
        }, 3000); // otomatis hilang setelah 3 detik
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div className="flex items-center bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl shadow-lg">
                <CheckCircleIcon className="h-6 w-6 mr-3 text-green-600" />
                <span className="font-medium">{message}</span>
                <button onClick={onClose} className="ml-3 text-green-700 hover:text-green-900">
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default SuccessAlertSA;
