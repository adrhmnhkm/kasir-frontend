const Category = require('../models/Category');

class CategoryController {
  async getAllCategories(req, res) {
    try {
      const categories = await Category.getAll();
      res.json(categories);
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.getById(parseInt(id));
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createCategory(req, res) {
    try {
      const categoryData = req.body;
      
      // Validate required fields
      if (!categoryData.name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Check if category name already exists
      const exists = await Category.existsByName(categoryData.name);
      if (exists) {
        return res.status(409).json({ 
          error: `Category with name '${categoryData.name}' already exists` 
        });
      }

      const newCategory = await Category.create(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error in createCategory:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const categoryData = req.body;
      
      // Validate required fields
      if (!categoryData.name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Check if category exists
      const existingCategory = await Category.getById(parseInt(id));
      if (!existingCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if new name conflicts with other categories
      const nameExists = await Category.existsByName(categoryData.name);
      if (nameExists && existingCategory.name.toLowerCase() !== categoryData.name.toLowerCase()) {
        return res.status(409).json({ 
          error: `Category with name '${categoryData.name}' already exists` 
        });
      }

      const updatedCategory = await Category.update(parseInt(id), categoryData);
      if (!updatedCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error in updateCategory:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      
      const success = await Category.delete(parseInt(id));
      if (!success) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      
      if (error.message.includes('Cannot delete category that has products')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CategoryController(); 