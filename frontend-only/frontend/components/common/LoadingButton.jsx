import React from 'react';

const LoadingButton = ({ 
  loading = false, 
  children, 
  className = '', 
  disabled = false,
  onClick,
  ...props 
}) => {
  return (
    <button
      className={`${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Make LoadingButton available globally
window.LoadingButton = LoadingButton;

export default LoadingButton;
