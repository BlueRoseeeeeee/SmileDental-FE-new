/*
* @author: HoTram
*/
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export const useFormPersistence = (storageKey, defaultValues = {}) => {
  // Khôi phục dữ liệu từ localStorage
  const getStoredData = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValues;
    } catch (error) {
      console.error('Error parsing stored form data:', error);
      return defaultValues;
    }
  };

  // Khởi tạo form với dữ liệu đã lưu
  const form = useForm({
    defaultValues: getStoredData(),
    mode: 'onChange' // Validate khi có thay đổi
  });

  // Lưu dữ liệu tự động khi có thay đổi
  useEffect(() => {
    const subscription = form.watch((data) => {
      localStorage.setItem(storageKey, JSON.stringify(data));
    });
    
    return () => subscription.unsubscribe();
  }, [form, storageKey]);

  // Xóa dữ liệu đã lưu
  const clearStoredData = () => {
    localStorage.removeItem(storageKey);
    form.reset(defaultValues);
  };

  // Khôi phục dữ liệu từ localStorage
  const restoreData = () => {
    const storedData = getStoredData();
    form.reset(storedData);
  };

  return {
    form,
    clearStoredData,
    restoreData
  };
};
