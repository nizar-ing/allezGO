import React from 'react';

/**
 * Dual Ring Loader - Clean & Modern
 */
function Loader({ message = "Chargement en cours...", className = "", fullHeight = true }) {
    return (
        <div className={`relative w-full ${fullHeight ? 'min-h-[300px] sm:min-h-[400px]' : 'py-10 sm:py-12'} flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-50 ${className}`}>
            <div className="flex flex-col items-center justify-center gap-5 sm:gap-7 px-4">
                {/* Dual Ring Spinner */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-4 border-gray-200 border-t-sky-800 rounded-full animate-spin"></div>

                    {/* Inner ring */}
                    <div className="absolute inset-2 border-4 border-gray-100 border-t-sky-700 rounded-full animate-spin-reverse"></div>
                </div>

                {/* Loading Text */}
                {message && (
                    <div className="text-center">
                        <p className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                            {message}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Veuillez patienter...
                        </p>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                
                .animate-spin-reverse {
                    animation: spin-reverse 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default Loader;
