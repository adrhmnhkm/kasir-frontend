// Format currency to Indonesian Rupiah
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Parse currency string to number
const parseCurrency = (currencyString) => {
  if (typeof currencyString === 'number') return currencyString;
  if (!currencyString) return 0;
  
  // Remove currency symbol and formatting
  const cleanString = currencyString
    .replace(/[Rp\s.]/g, '')
    .replace(/,/g, '.');
  
  return parseFloat(cleanString) || 0;
};

// Format number with thousand separators
const formatNumber = (number) => {
  return new Intl.NumberFormat('id-ID').format(number);
};

// Calculate percentage
const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Format percentage
const formatPercentage = (percentage) => {
  return `${percentage}%`;
};

// Make functions available globally
window.formatCurrency = formatCurrency;
window.parseCurrency = parseCurrency;
window.formatNumber = formatNumber;
window.calculatePercentage = calculatePercentage;
window.formatPercentage = formatPercentage; 

// Export for module-based imports
export { 
  formatCurrency, 
  parseCurrency, 
  formatNumber, 
  calculatePercentage, 
  formatPercentage 
};

export default {
  formatCurrency,
  parseCurrency,
  formatNumber,
  calculatePercentage,
  formatPercentage
};