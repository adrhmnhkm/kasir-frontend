// Format date to Indonesian locale
const formatDate = (dateString, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  return new Date(dateString).toLocaleDateString('id-ID', finalOptions);
};

// Format date only (no time)
const formatDateOnly = (dateString) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format time only
const formatTimeOnly = (dateString) => {
  return new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Get today's date in YYYY-MM-DD format
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// Get start of week
const getStartOfWeek = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
};

// Get start of month
const getStartOfMonth = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
};

// Get relative time (e.g., "2 hours ago")
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now - date;
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) return 'Baru saja';
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  
  return formatDateOnly(dateString);
};

// Check if date is today
const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Check if date is this week
const isThisWeek = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const startOfWeek = new Date(getStartOfWeek());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  return date >= startOfWeek && date <= endOfWeek;
};

// Make functions available globally
window.formatDate = formatDate;
window.formatDateOnly = formatDateOnly;
window.formatTimeOnly = formatTimeOnly;
window.formatDateForInput = formatDateForInput;
window.getTodayString = getTodayString;
window.getStartOfWeek = getStartOfWeek;
window.getStartOfMonth = getStartOfMonth;
window.getRelativeTime = getRelativeTime;
window.isToday = isToday;
window.isThisWeek = isThisWeek; 