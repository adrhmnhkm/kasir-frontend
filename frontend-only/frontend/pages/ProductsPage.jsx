const { useState, useEffect } = React;

const ProductsPage = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const { products, loading, loadProducts } = useProducts({ 
    search: searchTerm, 
    category: selectedCategory 
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (error) {
      showNotification('Error loading categories', 'error');
    }
  };

  // Product handlers
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      try {
        await api.products.delete(id);
        showNotification('Produk berhasil dihapus');
        loadProducts();
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }
  };

  const handleSaveProduct = () => {
    loadProducts();
    setEditingProduct(null);
    setShowProductModal(false);
  };

  const openProductModal = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  // Category handlers
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('Yakin ingin menghapus kategori ini?')) {
      try {
        await api.categories.delete(id);
        showNotification('Kategori berhasil dihapus');
        loadCategories();
        loadProducts(); // Refresh products to update category names
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }
  };

  const handleSaveCategory = () => {
    loadCategories();
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  const openCategoryModal = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Produk</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'products'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Produk
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'categories'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Kategori
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Kategori</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={openProductModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Tambah Produk
            </button>
          </div>

          <ProductTable
            products={products}
            loading={loading}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        </div>
      )}

      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Kategori Produk</h3>
            <button
              onClick={openCategoryModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Tambah Kategori
            </button>
          </div>

          <CategoryTable
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductForm
          isOpen={showProductModal}
          editingProduct={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => setShowProductModal(false)}
          showNotification={showNotification}
          onCategoryUpdate={loadCategories}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryForm
          isOpen={showCategoryModal}
          editingCategory={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => setShowCategoryModal(false)}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

// Make ProductsPage available globally
window.ProductsPage = ProductsPage; 