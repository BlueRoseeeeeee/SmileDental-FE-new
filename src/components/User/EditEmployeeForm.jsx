import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { userService } from '../../services/userService.js';

const EditEmployeeForm = ({ open, onClose, userId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    specialization: '',
    description: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});

  const roleOptions = [
    { value: 'admin', label: 'Quản trị viên', icon: '👑' },
    { value: 'manager', label: 'Quản lý', icon: '👔' },
    { value: 'dentist', label: 'Nha sĩ', icon: '🦷' },
    { value: 'nurse', label: 'Y tá', icon: '💉' },
    { value: 'receptionist', label: 'Lễ tân', icon: '📞' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' }
  ];

  useEffect(() => {
    if (open && userId) {
      fetchUserData();
    }
  }, [open, userId]);

  const fetchUserData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await userService.getUserById(userId);
      const user = response.user;
      
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        address: user.address || '',
        specialization: user.specialization || '',
        description: user.description || '',
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    } catch {
      setError('Không thể tải thông tin nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
    if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!formData.role) newErrors.role = 'Vai trò là bắt buộc';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    if (!formData.gender) newErrors.gender = 'Giới tính là bắt buộc';
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
    if (formData.role === 'dentist' && !formData.specialization.trim()) {
      newErrors.specialization = 'Chuyên môn là bắt buộc đối với nha sĩ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        // Chuyển đổi dateOfBirth thành format phù hợp
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        // Chỉ gửi specialization nếu là dentist
        ...(formData.role === 'dentist' && { specialization: formData.specialization })
      };

      await userService.updateUserByAdmin(userId, submitData);
      
      setSuccess('Cập nhật thông tin nhân viên thành công!');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin nhân viên');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      specialization: '',
      description: '',
      isActive: true
    });
    setErrors({});
    setError('');
    setSuccess('');
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Đang tải thông tin nhân viên...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          Chỉnh sửa thông tin nhân viên
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cập nhật thông tin nhân viên trong hệ thống
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" component="h3" sx={{ mb: 2, color: 'primary.main' }}>
              Thông tin cơ bản
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Họ và tên"
              value={formData.fullName}
              onChange={handleInputChange('fullName')}
              error={!!errors.fullName}
              helperText={errors.fullName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Số điện thoại"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={formData.role}
                onChange={handleInputChange('role')}
                label="Vai trò"
                startAdornment={
                  <InputAdornment position="start">
                    <WorkIcon color="action" />
                  </InputAdornment>
                }
              >
                {roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ngày sinh"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange('dateOfBirth')}
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Giới tính</InputLabel>
              <Select
                value={formData.gender}
                onChange={handleInputChange('gender')}
                label="Giới tính"
              >
                {genderOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Địa chỉ"
              multiline
              rows={2}
              value={formData.address}
              onChange={handleInputChange('address')}
              error={!!errors.address}
              helperText={errors.address}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {formData.role === 'dentist' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Chuyên môn"
                value={formData.specialization}
                onChange={handleInputChange('specialization')}
                error={!!errors.specialization}
                helperText={errors.specialization || 'Ví dụ: Nha khoa tổng quát, Chỉnh nha, Implant...'}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả thêm"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange('description')}
              helperText="Mô tả về kinh nghiệm, thành tích hoặc thông tin bổ sung"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.isActive}
                onChange={handleInputChange('isActive')}
                label="Trạng thái"
              >
                <MenuItem value={true}>Hoạt động</MenuItem>
                <MenuItem value={false}>Ngưng hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={saving}>
          Hủy
        </Button>
        
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEmployeeForm;
