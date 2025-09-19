import React from 'react';
const { useState, useEffect } = React;
import { api } from '../utils/api';

export default function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.products.getAll(filters);
      setProducts(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [JSON.stringify(filters)]);

  const createProduct = async (productData) => {
    try {
      const newProduct = await api.products.create(productData);
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const updatedProduct = await api.products.update(id, productData);
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? updatedProduct : product
        )
      );
      return updatedProduct;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.products.delete(id);
      
      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const searchProducts = (query) => {
    if (!query) return products;
    
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.code.toLowerCase().includes(searchTerm) ||
      (product.barcode && product.barcode.includes(searchTerm))
    );
  };

  const getProductsByCategory = (categoryId) => {
    if (!categoryId) return products;
    return products.filter(product => product.category_id === parseInt(categoryId));
  };

  const getLowStockProducts = () => {
    return products.filter(product => product.stock <= product.min_stock);
  };

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsByCategory,
    getLowStockProducts
  };
};

