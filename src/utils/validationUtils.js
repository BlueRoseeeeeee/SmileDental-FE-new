/*
* @author: HoTram
* Validation utilities for forms - Centralized validation logic
*/

/**
 * Auto-format full name (capitalize first letter of each word)
 * @param {string} name - Name to format
 * @returns {string} - Formatted name
 */
export const formatFullName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0) // Remove empty strings
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Vietnamese phone number
 * @param {string} phone - Phone to validate
 * @returns {boolean} - Is valid phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^0[0-9]{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate age for patients (1-100 years old)
 * @param {string} dateOfBirth - Date of birth (YYYY-MM-DD)
 * @returns {object} - {valid: boolean, message: string}
 */
export const validatePatientAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return { isValid: false, valid: false, message: 'Vui lòng chọn ngày sinh!' };
  }
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if date is in future
  if (birthDate > today) {
    return { isValid: false, valid: false, message: 'Ngày sinh không được ở tương lai!' };
  }
  
  // Calculate exact age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age = age - 1;
  }
  
  // Check age limits for patients
  if (age < 1) {
    return { isValid: false, valid: false, message: 'Tuổi phải từ 1 tuổi trở lên!' };
  }
  
  if (age > 100) {
    return { isValid: false, valid: false, message: 'Tuổi không được quá 100 tuổi!' };
  }
  
  return { isValid: true, valid: true, message: '' };
};

/**
 * Validate age for employees (18-70 years old)
 * @param {string} dateOfBirth - Date of birth (YYYY-MM-DD)
 * @returns {object} - {valid: boolean, message: string}
 */
export const validateEmployeeAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return { valid: false, message: 'Vui lòng chọn ngày sinh!' };
  }
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if date is in future
  if (birthDate > today) {
    return { valid: false, message: 'Ngày sinh không được ở tương lai!' };
  }
  
  // Calculate exact age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age = age - 1;
  }
  
  // Check age limits for employees
  if (age < 18) {
    return { valid: false, message: 'Nhân viên phải từ 18 tuổi trở lên!' };
  }
  
  if (age >= 70) {
    return { valid: false, message: 'Nhân viên phải dưới 70 tuổi!' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - {valid: boolean, message: string}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: 'Vui lòng nhập mật khẩu!' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 8 ký tự!' };
  }
  
  if (password.length > 16) {
    return { valid: false, message: 'Mật khẩu không được quá 16 ký tự!' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validate confirm password
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirm password
 * @returns {object} - {valid: boolean, message: string}
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { valid: false, message: 'Vui lòng xác nhận mật khẩu!' };
  }
  
  if (password !== confirmPassword) {
    return { valid: false, message: 'Mật khẩu xác nhận không khớp! Vui lòng nhập lại.' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validate OTP (6 digits 0-9)
 * @param {string} otp - OTP to validate
 * @returns {object} - {valid: boolean, message: string}
 */
export const validateOTP = (otp) => {
  if (!otp || !otp.trim()) {
    return { valid: false, message: 'Vui lòng nhập mã OTP!' };
  }
  
  const otpRegex = /^[0-9]{6}$/;
  if (!otpRegex.test(otp.trim())) {
    return { valid: false, message: 'Mã OTP phải là 6 chữ số!' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validate full name
 * @param {string} fullName - Full name to validate
 * @returns {object} - {valid: boolean, message: string}
 */
export const validateFullName = (fullName) => {
  if (!fullName || !fullName.trim()) {
    return { valid: false, message: 'Vui lòng nhập họ và tên!' };
  }
  
  const trimmedName = fullName.trim();
  
  // Check minimum characters first
  if (trimmedName.length < 2) {
    return { valid: false, message: 'Họ và tên phải có ít nhất 2 ký tự!' };
  }
  
  // Then check minimum words
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 2) {
    return { valid: false, message: 'Họ và tên phải có ít nhất 2 từ!' };
  }
  
  return { valid: true, message: '' };
};

// ==================== REACT HOOK FORM VALIDATION RULES ====================

/**
 * Get validation rules for React Hook Form (Register.jsx)
 */
export const getReactHookFormRules = {
  email: () => ({
    required: 'Vui lòng nhập email!',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email không đúng định dạng! (VD: example@gmail.com)'
    }
  }),

  otp: () => ({
    required: 'Vui lòng nhập mã OTP!',
    pattern: {
      value: /^[0-9]{6}$/,
      message: 'Mã OTP phải là 6 chữ số từ 0-9!'
    },
    validate: (value) => {
      const validation = validateOTP(value);
      return validation.valid || validation.message;
    }
  }),

  fullName: () => ({
    required: 'Vui lòng nhập họ và tên!',
    minLength: {
      value: 2,
      message: 'Họ và tên phải có ít nhất 2 ký tự!'
    },
    validate: (value) => {
      const validation = validateFullName(value);
      return validation.valid || validation.message;
    }
  }),

  phone: () => ({
    required: 'Vui lòng nhập số điện thoại!',
    pattern: {
      value: /^0[0-9]{9}$/,
      message: 'Số điện thoại phải có 10 số và bắt đầu bằng số 0!'
    }
  }),

  dateOfBirthPatient: () => ({
    required: 'Vui lòng chọn ngày sinh!',
    validate: (value) => {
      const validation = validatePatientAge(value);
      return validation.valid || validation.message;
    }
  }),

  dateOfBirthEmployee: () => ({
    required: 'Vui lòng chọn ngày sinh!',
    validate: (value) => {
      const validation = validateEmployeeAge(value);
      return validation.valid || validation.message;
    }
  }),

  password: () => ({
    required: 'Vui lòng nhập mật khẩu!',
    minLength: {
      value: 8,
      message: 'Mật khẩu phải có ít nhất 8 ký tự!'
    },
    maxLength: {
      value: 16,
      message: 'Mật khẩu không được quá 16 ký tự!'
    }
  }),

  confirmPassword: (passwordField) => ({
    required: 'Vui lòng xác nhận mật khẩu!',
    validate: (value, formValues) => {
      const passwordValue = formValues[passwordField];
      const validation = validateConfirmPassword(passwordValue, value);
      return validation.valid || validation.message;
    }
  }),

  gender: () => ({
    required: 'Vui lòng chọn giới tính!'
  }),

  role: () => ({
    required: 'Vui lòng chọn vai trò!'
  }),

};

// ==================== ANT DESIGN FORM VALIDATION RULES ====================

/**
 * Get validation rules for Ant Design Form (UserManagement.jsx)
 */
export const getAntDesignFormRules = {
  email: () => [
    { required: true, message: 'Vui lòng nhập email!' }, // ✅ Email is required for staff
    { type: 'email', message: 'Email không đúng định dạng!' }
  ],

  fullName: () => [
    { required: true, message: 'Vui lòng nhập họ và tên!' },
    { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' },
    {
      validator: (_, value) => {
        if (!value || value.length < 2) return Promise.resolve();
        
        const words = value.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length < 2) {
          return Promise.reject(new Error('Họ và tên phải có ít nhất 2 từ!'));
        }
        return Promise.resolve();
      }
    }
  ],

  phone: () => [
    { required: true, message: 'Vui lòng nhập số điện thoại!' },
    { pattern: /^0[0-9]{9}$/, message: 'Số điện thoại phải có 10 số và bắt đầu bằng số 0!' }
  ],

  dateOfBirthPatient: () => [
    { required: true, message: 'Vui lòng chọn ngày sinh!' },
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        const dateString = value.format ? value.format('YYYY-MM-DD') : value;
        const validation = validatePatientAge(dateString);
        if (!validation.valid) {
          return Promise.reject(new Error(validation.message));
        }
        return Promise.resolve();
      }
    }
  ],

  dateOfBirthEmployee: () => [
    { required: true, message: 'Vui lòng chọn ngày sinh!' },
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        const dateString = value.format ? value.format('YYYY-MM-DD') : value;
        const validation = validateEmployeeAge(dateString);
        if (!validation.valid) {
          return Promise.reject(new Error(validation.message));
        }
        return Promise.resolve();
      }
    }
  ],

  password: () => [
    { required: true, message: 'Vui lòng nhập mật khẩu!' },
    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
    { max: 16, message: 'Mật khẩu không được quá 16 ký tự!' }
  ],

  confirmPassword: () => [
    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const password = getFieldValue('password');
        const validation = validateConfirmPassword(password, value);
        if (!validation.valid) {
          return Promise.reject(new Error(validation.message));
        }
        return Promise.resolve();
      }
    })
  ],

  gender: () => [
    { required: true, message: 'Vui lòng chọn giới tính!' }
  ],

  role: () => [
    { required: true, message: 'Vui lòng chọn vai trò!' }
  ],

  otp: () => [
    { required: true, message: 'Vui lòng nhập mã OTP!' },
    { pattern: /^[0-9]{6}$/, message: 'Mã OTP phải là 6 chữ số từ 0-9!' }
  ],

  description: () => [
    { max: 500, message: 'Mô tả không được vượt quá 500 ký tự!' }
  ]
};

// ==================== UTILITY HELPERS ====================

/**
 * Handle full name input formatting (for onBlur events)
 * @param {Event} event - Input blur event
 * @param {Function} setValue - Function to set form value
 */
export const handleFullNameFormat = (event, setValue) => {
  const value = event.target.value;
  if (value) {
    const formattedName = formatFullName(value);
    setValue('fullName', formattedName);
  }
};

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date of birth (YYYY-MM-DD)
 * @returns {number} - Age in years
 */
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age = age - 1;
  }
  
  return age;
};

/**
 * Check if user is old enough to be an employee
 * @param {string} dateOfBirth - Date of birth (YYYY-MM-DD)
 * @returns {boolean} - Is old enough for employee
 */
export const isEmployeeAge = (dateOfBirth) => {
  const validation = validateEmployeeAge(dateOfBirth);
  return validation.valid;
};

/**
 * Check if user age is valid for patient
 * @param {string} dateOfBirth - Date of birth (YYYY-MM-DD)
 * @returns {boolean} - Is valid patient age
 */
export const isPatientAge = (dateOfBirth) => {
  const validation = validatePatientAge(dateOfBirth);
  return validation.valid;
};