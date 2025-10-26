/*
* @author: HoTram
*/

/**
 * Tìm kiếm trong mảng dữ liệu dựa trên từ khóa
 * @param {Array} data - Mảng dữ liệu cần tìm kiếm
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {Array} searchFields - Các trường cần tìm kiếm
 * @returns {Array} - Mảng kết quả đã lọc
 */
export const searchInData = (data, searchTerm, searchFields = []) => {
  if (!searchTerm || !searchTerm.trim()) {
    return data;
  }

  const term = searchTerm.toLowerCase().trim();
  
  return data.filter(item => {
    return searchFields.some(field => {
      const fieldValue = getNestedValue(item, field);
      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }
      
      // Chuyển đổi giá trị thành chuỗi và tìm kiếm
      const stringValue = String(fieldValue).toLowerCase();
      return stringValue.includes(term);
    });
  });
};

/**
 * Lấy giá trị từ object theo đường dẫn (nested property)
 * @param {Object} obj - Object cần lấy giá trị
 * @param {string} path - Đường dẫn đến property (vd: 'user.name')
 * @returns {*} - Giá trị của property
 */
export const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Lọc dữ liệu dựa trên các bộ lọc
 * @param {Array} data - Mảng dữ liệu cần lọc
 * @param {Object} filters - Object chứa các bộ lọc
 * @returns {Array} - Mảng kết quả đã lọc
 */
export const filterData = (data, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return data;
  }

  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        return true;
      }

      let itemValue = getNestedValue(item, key);
      
      // 🆕 Xử lý đặc biệt cho roles: fallback sang role nếu roles không tồn tại
      if (key === 'roles' && !itemValue) {
        const singleRole = getNestedValue(item, 'role');
        itemValue = singleRole ? [singleRole] : null;
      }
      
      // Xử lý boolean values
      if (typeof value === 'boolean') {
        return itemValue === value;
      }
      
      // Xử lý string values
      if (typeof value === 'string') {
        return String(itemValue).toLowerCase().includes(value.toLowerCase());
      }
      
      // Xử lý array values (multiple selection cho filter)
      if (Array.isArray(value)) {
        // Nếu array rỗng, bỏ qua filter này
        if (value.length === 0) {
          return true;
        }
        
        // 🆕 Nếu itemValue cũng là array (ví dụ: user.roles = ['manager', 'dentist'])
        // Kiểm tra xem có bất kỳ role nào trong itemValue match với filter value không
        if (Array.isArray(itemValue)) {
          return value.some(filterVal => itemValue.includes(filterVal));
        }
        
        // Nếu itemValue là single value (ví dụ: user.role = 'dentist')
        // Kiểm tra xem itemValue có nằm trong filter value không
        return value.includes(itemValue);
      }
      
      return itemValue === value;
    });
  });
};

/**
 * Kết hợp tìm kiếm và lọc dữ liệu
 * @param {Array} data - Mảng dữ liệu gốc
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {Array} searchFields - Các trường tìm kiếm
 * @param {Object} filters - Các bộ lọc
 * @returns {Array} - Mảng kết quả cuối cùng
 */
export const searchAndFilter = (data, searchTerm, searchFields = [], filters = {}) => {
  let result = data;
  
  // Áp dụng tìm kiếm trước
  if (searchTerm && searchFields.length > 0) {
    result = searchInData(result, searchTerm, searchFields);
  }
  
  // Áp dụng bộ lọc sau
  if (filters && Object.keys(filters).length > 0) {
    result = filterData(result, filters);
  }
  
  return result;
};

/**
 * Tạo cấu hình filter cho các trường thông thường
 * @param {string} key - Key của filter
 * @param {string} label - Label hiển thị
 * @param {Array} options - Danh sách options
 * @param {string} placeholder - Placeholder text
 * @returns {Object} - Cấu hình filter
 */
export const createFilterConfig = (key, label, options, placeholder = 'Chọn...') => {
  return {
    key,
    label,
    options,
    placeholder
  };
};

/**
 * Tạo cấu hình filter cho role
 * @returns {Object} - Cấu hình filter role
 */
export const createRoleFilter = () => {
  return {
    ...createFilterConfig(
      'roles', // 🆕 Đổi từ 'role' thành 'roles' để match với data structure
      'Lọc theo vai trò',
      [
        { value: 'admin', label: 'Quản trị viên' },
        { value: 'manager', label: 'Quản lý' },
        { value: 'dentist', label: 'Nha sĩ' },
        { value: 'nurse', label: 'Y tá' },
        { value: 'receptionist', label: 'Lễ tân' },
      ],
      'Chọn vai trò'
    ),
    multiple: true // Enable multiple selection
  };
};

/**
 * Tạo cấu hình filter cho trạng thái
 * @returns {Object} - Cấu hình filter trạng thái
 */
export const createStatusFilter = () => {
  return createFilterConfig(
    'isActive',
    'Lọc theo trạng thái',
    [
      { value: true, label: 'Hoạt động' },
      { value: false, label: 'Không hoạt động' }
    ],
    'Chọn trạng thái'
  );
};

/**
 * Tạo cấu hình filter cho giới tính
 * @returns {Object} - Cấu hình filter giới tính
 */
export const createGenderFilter = () => {
  return createFilterConfig(
    'gender',
    'Lọc theo giới tính',
    [
      { value: 'male', label: 'Nam' },
      { value: 'female', label: 'Nữ' },
      { value: 'other', label: 'Khác' }
    ],
    'Chọn giới tính'
  );
};

/**
 * Tạo cấu hình filter cho ngày tạo
 * @returns {Object} - Cấu hình filter ngày tạo
 */
export const createDateFilter = () => {
  return createFilterConfig(
    'dateRange',
    'Lọc theo ngày tạo',
    [
      { value: 'today', label: 'Hôm nay' },
      { value: 'week', label: 'Tuần này' },
      { value: 'month', label: 'Tháng này' },
      { value: 'year', label: 'Năm nay' }
    ],
    'Chọn khoảng thời gian'
  );
};

/**
 * Debounce function để tối ưu hiệu suất tìm kiếm
 * @param {Function} func - Function cần debounce
 * @param {number} delay - Thời gian delay (ms)
 * @returns {Function} - Function đã được debounce
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Highlight text trong kết quả tìm kiếm
 * @param {string} text - Text gốc
 * @param {string} searchTerm - Từ khóa cần highlight
 * @returns {string} - HTML string với highlight
 */
export const highlightText = (text, searchTerm) => {
  if (!searchTerm || !text) {
    return text;
  }
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Tạo search suggestions dựa trên dữ liệu
 * @param {Array} data - Dữ liệu gốc
 * @param {Array} fields - Các trường cần tạo suggestions
 * @param {number} limit - Số lượng suggestions tối đa
 * @returns {Array} - Mảng suggestions
 */
export const generateSearchSuggestions = (data, fields, limit = 10) => {
  const suggestions = new Set();
  
  data.forEach(item => {
    fields.forEach(field => {
      const value = getNestedValue(item, field);
      if (value && typeof value === 'string') {
        const words = value.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 2) {
            suggestions.add(word);
          }
        });
      }
    });
  });
  
  return Array.from(suggestions).slice(0, limit);
};

/**
 * Tính điểm relevance cho kết quả tìm kiếm
 * @param {Object} item - Item cần tính điểm
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {Array} searchFields - Các trường tìm kiếm
 * @returns {number} - Điểm relevance
 */
export const calculateRelevanceScore = (item, searchTerm, searchFields) => {
  if (!searchTerm) return 0;
  
  const term = searchTerm.toLowerCase();
  let score = 0;
  
  searchFields.forEach(field => {
    const value = getNestedValue(item, field);
    if (value) {
      const stringValue = String(value).toLowerCase();
      
      // Exact match có điểm cao nhất
      if (stringValue === term) {
        score += 100;
      }
      // Starts with có điểm cao
      else if (stringValue.startsWith(term)) {
        score += 80;
      }
      // Contains có điểm trung bình
      else if (stringValue.includes(term)) {
        score += 50;
      }
      // Word boundary match có điểm cao
      else if (new RegExp(`\\b${term}`, 'i').test(stringValue)) {
        score += 70;
      }
    }
  });
  
  return score;
};

/**
 * Sắp xếp kết quả theo relevance
 * @param {Array} data - Dữ liệu cần sắp xếp
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {Array} searchFields - Các trường tìm kiếm
 * @returns {Array} - Dữ liệu đã sắp xếp theo relevance
 */
export const sortByRelevance = (data, searchTerm, searchFields) => {
  if (!searchTerm) return data;
  
  return data.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, searchTerm, searchFields);
    const scoreB = calculateRelevanceScore(b, searchTerm, searchFields);
    return scoreB - scoreA;
  });
};
