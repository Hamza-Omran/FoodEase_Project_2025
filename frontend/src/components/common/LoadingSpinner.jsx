import React from 'react';

const LoadingSpinner = ({ fullScreen = true }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-orange-600 animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center p-4">
            <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-orange-600 animate-spin"></div>
        </div>
    );
};

export default LoadingSpinner;
