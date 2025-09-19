import React from 'react';

const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const typeIcons = {
    success: 'fas fa-check',
    error: 'fas fa-exclamation-triangle',
    warning: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${typeStyles[notification.type] || typeStyles.info} text-white max-w-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <i className={`${typeIcons[notification.type] || typeIcons.info} mr-2`}></i>
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

// Make Notification available globally
window.Notification = Notification; 