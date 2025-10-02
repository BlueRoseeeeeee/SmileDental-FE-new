/*
* @author: HoTram
*/
import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  FormHelperText
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { authService } from '../../services/authService.js';

const AddEmployeeForm = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Bước 1: Thông tin cơ bản
    fullName: '',
    email: '',
    phone: '',
    role: '',
    
    // Bước 2: Thông tin chi tiết
    dateOfBirth: '',
    gender: '',
    address: '',
    specialization: '',
    description: '',
    
    // Bước 3: Tài khoản
    password: '',
    confirmPassword: '',
    otp: ''
  });

  const [errors, setErrors] = useState({});

  const steps = [
    'Thông tin cơ bản',
    'Thông tin chi tiết', 
    'Tạo tài khoản'
  ];

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

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Thông tin cơ bản
        if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
        if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
        if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
        else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Số điện thoại không hợp lệ';
        if (!formData.role) newErrors.role = 'Vai trò là bắt buộc';
        break;

      case 1: // Thông tin chi tiết
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
        if (!formData.gender) newErrors.gender = 'Giới tính là bắt buộc';
        if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
        if (formData.role === 'dentist' && !formData.specialization.trim()) {
          newErrors.specialization = 'Chuyên môn là bắt buộc đối với nha sĩ';
        }
        break;

      case 2: // Tài khoản
        if (!formData.password) newErrors.password = 'Mật khẩu là bắt buộc';
        else if (formData.password.length < 8 || formData.password.length > 16) {
          newErrors.password = 'Mật khẩu phải có độ dài từ 8 đến 16 ký tự';
        }
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
        else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }
        if (!formData.otp) newErrors.otp = 'Mã OTP là bắt buộc';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập email trước khi gửi OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authService.sendOtpRegister(formData.email);
      setOtpSent(true);
      setSuccess('Mã OTP đã được gửi đến email của bạn');
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        // Chuyển đổi dateOfBirth thành format phù hợp
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        // Chỉ gửi specialization nếu là dentist
        ...(formData.role === 'dentist' && { specialization: formData.specialization })
      };

      await authService.register(submitData);
      
      setSuccess('Thêm nhân viên thành công!');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
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
      password: '',
      confirmPassword: '',
      otp: ''
    });
    setErrors({});
    setError('');
    setSuccess('');
    setOtpSent(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
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

            <Grid item xs={12}>
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
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
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
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon color="primary" />
                    <Typography variant="subtitle2">Xác thực Email</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Chúng tôi sẽ gửi mã OTP đến email: <strong>{formData.email}</strong>
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleSendOtp}
                    disabled={loading || otpSent}
                    startIcon={otpSent ? <CheckCircleIcon /> : <SendIcon />}
                  >
                    {otpSent ? 'Đã gửi OTP' : 'Gửi mã OTP'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mã OTP"
                value={formData.otp}
                onChange={handleInputChange('otp')}
                error={!!errors.otp}
                helperText={errors.otp}
                disabled={!otpSent}
                placeholder="Nhập mã OTP 6 chữ số"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Xác nhận mật khẩu"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

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
          Thêm nhân viên mới
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Điền đầy đủ thông tin để tạo tài khoản nhân viên
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

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

        {/* Step Content */}
        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Quay lại
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={loading}
          >
            Tiếp theo
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading || !otpSent}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {loading ? 'Đang tạo...' : 'Tạo nhân viên'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddEmployeeForm;
