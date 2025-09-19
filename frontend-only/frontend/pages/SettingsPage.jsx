import React from 'react';

const { useState, useEffect } = React;

const SettingsPage = ({ showNotification }) => {
  const [settings, setSettings] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    tax_rate: 0.11,
    currency: 'IDR',
    receipt_footer: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.settings.get();
      setSettings(data);
    } catch (error) {
      showNotification('Error loading settings', 'error');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await api.settings.update(settings);
      showNotification('Settings berhasil disimpan!');
    } catch (error) {
      showNotification(`Error saving settings: ${error.message}`, 'error');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              <i className="fas fa-cog mr-2"></i>
              Pengaturan Toko
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Kelola informasi toko dan pengaturan sistem
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Informasi Toko
                </h3>
                
                <div>
                  <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Toko *
                  </label>
                  <input
                    type="text"
                    id="store_name"
                    name="store_name"
                    value={settings.store_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama toko Anda"
                  />
                </div>

                <div>
                  <label htmlFor="store_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Toko
                  </label>
                  <textarea
                    id="store_address"
                    name="store_address"
                    value={settings.store_address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Alamat lengkap toko"
                  />
                </div>

                <div>
                  <label htmlFor="store_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    id="store_phone"
                    name="store_phone"
                    value={settings.store_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nomor telepon toko"
                  />
                </div>

                <div>
                  <label htmlFor="store_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="store_email"
                    name="store_email"
                    value={settings.store_email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email toko"
                  />
                </div>
              </div>

              {/* System Settings */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Pengaturan Sistem
                </h3>
                
                <div>
                  <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Pajak (%)
                  </label>
                  <input
                    type="number"
                    id="tax_rate"
                    name="tax_rate"
                    value={settings.tax_rate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Mata Uang
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IDR">IDR - Rupiah Indonesia</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="receipt_footer" className="block text-sm font-medium text-gray-700 mb-1">
                    Footer Struk
                  </label>
                  <textarea
                    id="receipt_footer"
                    name="receipt_footer"
                    value={settings.receipt_footer}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Teks yang akan muncul di bagian bawah struk"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <i className="fas fa-save mr-2"></i>
                    Simpan Pengaturan
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Make SettingsPage available globally
window.SettingsPage = SettingsPage; 