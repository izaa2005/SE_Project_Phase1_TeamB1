/**
 * ========================================
 * ERROR DISPLAY COMPONENT
 * ========================================
 * 
 * Izabela: "When something goes wrong on the frontend (API failed, network error, etc.),
 *          we show this component instead of a blank page."
 * 
 * Anxhela: "It's got a 'Try Again' button to retry the failed request, 
 *          and a 'Reload Page' button as a nuclear option."
 * 
 * Megi: "The shake animation on mount draws attention to it - users won't miss 
 *       that something went wrong!"
 */

import { AlertCircle, RefreshCw } from 'lucide-react';

// CSS Trick: Using a gradient border and subtle shadow for error container.
// Personal touch: Added a shake animation on mount to draw attention.

const ErrorDisplay = ({ error, onRetry }) => {
  return (
    <div className="animate-shake max-w-2xl mx-auto bg-white border-l-4 border-red-500 rounded-r-lg p-6 shadow-md">
      <div className="flex items-start">
        {/* ===== ERROR ICON ===== */}
        {/* Izabela: "Red alert circle icon to make it obvious this is an error" */}
        <AlertCircle className="w-8 h-8 text-red-500 mr-4 flex-shrink-0" />
        
        <div className="flex-1">
          {/* ===== ERROR TITLE ===== */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
          
          {/* ===== ERROR MESSAGE ===== */}
          {/* Megi: "Show the actual error message from the backend or a generic fallback" */}
          <p className="text-gray-700 mb-4">
            {error?.message || 'An unexpected error occurred while fetching data.'}
          </p>
          
          {/* ===== ACTION BUTTONS ===== */}
          <div className="flex flex-wrap gap-3">
            {/* ===== RETRY BUTTON ===== */}
            {/* Anxhela: "Only show if onRetry callback is provided" */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            )}
            
            {/* ===== RELOAD BUTTON ===== */}
            {/* Izabela: "Full page reload - sometimes the nuclear option is necessary" */}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;