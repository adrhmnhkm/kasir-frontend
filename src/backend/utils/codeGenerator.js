const moment = require('moment');

class CodeGenerator {
  // Get prefix based on category name (more flexible)
  static async getPrefixFromCategoryName(categoryName, categoryId = null) {
    if (!categoryName) return 'PRD';
    
    // If we have categoryId, try to get prefix from database first
    if (categoryId) {
      try {
        const Category = require('../models/Category');
        const category = await Category.getById(categoryId);
        if (category && category.prefix) {
          return category.prefix;
        }
      } catch (error) {
        console.error('Error getting category prefix:', error);
      }
    }
    
    const categoryNameUpper = categoryName.toUpperCase();
    
    // Fallback mapping based on category name
    const prefixMap = {
      'PIPA PVC': 'PVC',
      'FITTING PVC': 'FIT',
      'PIPA GALVANIS': 'GAL',
      'FITTING GALVANIS': 'FTG',
      'SEMEN': 'SEM',
      'CAT': 'CAT',
      'ALAT': 'ALT',
      'TEPUNG': 'TEP',
      'LAIN-LAIN': 'LNY',
      'PIPA': 'PIP',
      'FITTING': 'FIT',
      'BAHAN BANGUNAN': 'BBG',
      'PERTUKANGAN': 'PTK',
      'SANITARI': 'SNT',
      'LISTRIK': 'LST',
      'PENGECATAN': 'PNG',
      'PERLENGKAPAN': 'PLK'
    };
    
    // Try exact match first
    if (prefixMap[categoryNameUpper]) {
      return prefixMap[categoryNameUpper];
    }
    
    // Try partial match
    for (const [key, prefix] of Object.entries(prefixMap)) {
      if (categoryNameUpper.includes(key) || key.includes(categoryNameUpper)) {
        return prefix;
      }
    }
    
    // Generate prefix from first 3 letters of category name
    return categoryNameUpper.substring(0, 3);
  }

  // Generate Product Code with Category Prefix
  static async generateProductCode(categoryId, categoryName = null, categoryPrefix = null) {
    let prefix;
    
    if (categoryPrefix) {
      prefix = categoryPrefix;
    } else if (categoryName) {
      prefix = await this.getPrefixFromCategoryName(categoryName, categoryId);
    } else {
      // Fallback to ID-based prefixes
      const defaultPrefixes = {
        1: 'PVC',    // Pipa PVC
        2: 'FIT',    // Fitting PVC
        3: 'GAL',    // Pipa Galvanis
        4: 'FTG',    // Fitting Galvanis
        5: 'SEM',    // Semen
        6: 'CAT',    // Cat
        7: 'ALT',    // Alat
        8: 'TEP',    // Tepung
        9: 'LNY'     // Lain-lain
      };
      prefix = defaultPrefixes[categoryId] || 'PRD';
    }

    const timestamp = moment().format('YYMMDD');
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  }

  // Generate Sequential Product Code
  static async generateSequentialCode(categoryId, categoryName = null, existingCodes = []) {
    let prefix;
    
    if (categoryName) {
      prefix = await this.getPrefixFromCategoryName(categoryName, categoryId);
    } else {
      // Fallback to ID-based prefixes
      const prefixes = {
        1: 'PVC',    // Pipa PVC
        2: 'FIT',    // Fitting PVC
        3: 'GAL',    // Pipa Galvanis
        4: 'FTG',    // Fitting Galvanis
        5: 'SEM',    // Semen
        6: 'CAT',    // Cat
        7: 'ALT',    // Alat
        8: 'TEP',    // Tepung
        9: 'LNY'     // Lain-lain
      };
      prefix = prefixes[categoryId] || 'PRD';
    }
    
    // Find existing codes with same prefix
    const samePrefix = existingCodes
      .filter(code => code.startsWith(prefix))
      .map(code => {
        const numberPart = code.substring(prefix.length);
        return parseInt(numberPart) || 0;
      })
      .sort((a, b) => b - a);

    const nextNumber = samePrefix.length > 0 ? samePrefix[0] + 1 : 1;
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  // Generate EAN-13 Barcode
  static generateEAN13Barcode(countryCode = '890') {
    // 890 = Indonesia country code
    const manufacturerCode = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    const productCode = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    
    const partialCode = countryCode + manufacturerCode + productCode;
    const checkDigit = this.calculateEAN13CheckDigit(partialCode);
    
    return partialCode + checkDigit;
  }

  // Calculate EAN-13 Check Digit
  static calculateEAN13CheckDigit(code) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code[i]);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    return ((10 - (sum % 10)) % 10).toString();
  }

  // Generate Code-128 compatible code
  static generateCode128() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return timestamp + random;
  }

  // Validate Barcode Format
  static validateBarcode(barcode, format = 'EAN13') {
    switch (format) {
      case 'EAN13':
        if (barcode.length !== 13) return false;
        if (!/^\d+$/.test(barcode)) return false;
        
        const calculated = this.calculateEAN13CheckDigit(barcode.substring(0, 12));
        return calculated === barcode.charAt(12);
        
      case 'CODE128':
        return barcode.length >= 6 && barcode.length <= 20;
        
      default:
        return true;
    }
  }

  // Generate Product Code Options
  static async generateCodeOptions(categoryId, categoryName, existingCodes = []) {
    return {
      sequential: await this.generateSequentialCode(categoryId, categoryName, existingCodes),
      timestamp: await this.generateProductCode(categoryId, categoryName),
      custom: `${await this.getPrefixFromCategoryName(categoryName)}001`
    };
  }

  // Generate Barcode Options
  static generateBarcodeOptions() {
    return {
      ean13: this.generateEAN13Barcode(),
      code128: this.generateCode128(),
      random: Math.floor(Math.random() * 9999999999999).toString().padStart(13, '0')
    };
  }

  // Get all available prefixes for reference
  static getAvailablePrefixes() {
    return {
      'Pipa PVC': 'PVC',
      'Fitting PVC': 'FIT', 
      'Pipa Galvanis': 'GAL',
      'Fitting Galvanis': 'FTG',
      'Semen': 'SEM',
      'Cat': 'CAT',
      'Alat': 'ALT',
      'Tepung': 'TEP',
      'Lain-lain': 'LNY',
      'Pipa': 'PIP',
      'Fitting': 'FIT',
      'Bahan Bangunan': 'BBG',
      'Pertukangan': 'PTK',
      'Sanitari': 'SNT',
      'Listrik': 'LST',
      'Pengecatan': 'PNG',
      'Perlengkapan': 'PLK'
    };
  }
}

module.exports = CodeGenerator; 