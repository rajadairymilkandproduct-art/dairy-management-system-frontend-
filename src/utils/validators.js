// Form Validation Utilities
export const validators = {
  required: (value, fieldName) => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value, fieldName = "Email") => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return `${fieldName} is invalid`;
    }
    return null;
  },

  phone: (value, fieldName = "Phone") => {
    const phoneRegex = /^[0-9]{10}$/;
    if (value && !phoneRegex.test(value.replace(/\D/g, ""))) {
      return `${fieldName} must be 10 digits`;
    }
    return null;
  },

  minLength: (value, length, fieldName) => {
    if (value && value.toString().length < length) {
      return `${fieldName} must be at least ${length} characters`;
    }
    return null;
  },

  minValue: (value, min, fieldName) => {
    if (value !== "" && Number(value) < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  maxValue: (value, max, fieldName) => {
    if (value !== "" && Number(value) > max) {
      return `${fieldName} cannot exceed ${max}`;
    }
    return null;
  },

  number: (value, fieldName = "Value") => {
    if (value !== "" && isNaN(Number(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  positive: (value, fieldName = "Value") => {
    if (value !== "" && Number(value) <= 0) {
      return `${fieldName} must be greater than 0`;
    }
    return null;
  },

  percentage: (value, fieldName = "Percentage") => {
    if (value !== "" && (Number(value) < 0 || Number(value) > 100)) {
      return `${fieldName} must be between 0 and 100`;
    }
    return null;
  },

  dateRange: (startDate, endDate, fieldName = "Dates") => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return `${fieldName}: Start date must be before end date`;
    }
    return null;
  },

  creditCard: (value, fieldName = "Card Number") => {
    const cardRegex = /^[0-9]{13,19}$/;
    if (value && !cardRegex.test(value.replace(/\s/g, ""))) {
      return `${fieldName} is invalid`;
    }
    return null;
  },
};

// Form Error Handler
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.entries(rules).forEach(([field, fieldRules]) => {
    if (Array.isArray(fieldRules)) {
      for (const rule of fieldRules) {
        const error = rule(formData[field]);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    }
  });

  return errors;
};

// Sanitize Input
export const sanitizeInput = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().replace(/[<>\"\']/g, "");
};

// Format Phone
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{5})(\d{5})/, "$1 $2");
  }
  return cleaned;
};

// Validate Credit Limit
export const validateCreditLimit = (amount, creditLimit, outstanding) => {
  const available = creditLimit - outstanding;
  if (amount > available) {
    return {
      valid: false,
      message: `Insufficient credit. Available: ₹${available}`,
    };
  }
  return { valid: true, message: null };
};

// Validate Inventory Stock
export const validateInventoryStock = (quantity, available, fieldName = "Quantity") => {
  if (quantity > available) {
    return {
      valid: false,
      message: `${fieldName} cannot exceed available stock (${available})`,
    };
  }
  return { valid: true, message: null };
};

// Validate Production Loss
export const validateProductionLoss = (input, output) => {
  const lossPercent = ((input - output) / input * 100).toFixed(1);
  
  if (lossPercent > 20) {
    return {
      warning: true,
      message: `High loss detected: ${lossPercent}%. Please verify inputs.`,
    };
  }
  
  if (output > input) {
    return {
      valid: false,
      message: "Output quantity cannot exceed input quantity",
    };
  }

  return { valid: true, message: null };
};
