import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Avatar,
  Chip,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  Description as DescriptionIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  LocalHospital as DentistIcon,
  HealthAndSafety as NurseIcon,
  SupportAgent as ReceptionistIcon
} from '@mui/icons-material';
import { userService } from '../../services/userService.js';

const EmployeeDetailModal = ({ open, onClose, userId, onEdit }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await userService.getUserById(userId);
      setUser(response.user);
    } catch (error) {
      setError('Không thể tải thông tin nhân viên');
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUser(null);
    setError('');
    setActiveTab(0);
    onClose();
  };

  const getRoleConfig = (role) => {
    const configs = {
      admin: { 
        name: 'Quản trị viên', 
        color: 'error', 
        icon: <AdminIcon /> 
      },
      manager: { 
        name: 'Quản lý', 
        color: 'primary', 
        icon: <ManagerIcon /> 
      },
      dentist: { 
        name: 'Nha sĩ', 
        color: 'success', 
        icon: <DentistIcon /> 
      },
      nurse: { 
        name: 'Y tá', 
        color: 'warning', 
        icon: <NurseIcon /> 
      },
      receptionist: { 
        name: 'Lễ tân', 
        color: 'secondary', 
        icon: <ReceptionistIcon /> 
      },
    };
    return configs[role] || { name: role, color: 'default', icon: <PersonIcon /> };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBasicInfo = () => {
    if (!user) return null;

    const roleConfig = getRoleConfig(user.role);

    return (
      <Grid container spacing={3}>
        {/* Avatar and Basic Info */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                <Avatar
                  src={user.avatar}
                  sx={{ width: 80, height: 80 }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {user.fullName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Chip
                      icon={roleConfig.icon}
                      label={roleConfig.name}
                      color={roleConfig.color}
                      variant="outlined"
                    />
                    {user.employeeCode && (
                      <Chip
                        icon={<BadgeIcon />}
                        label={user.employeeCode}
                        variant="filled"
                        color="info"
                      />
                    )}
                  </Box>
                  <Chip
                    label={user.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                    color={user.isActive ? 'success' : 'error'}
                    variant="filled"
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Email:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {user.email}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PhoneIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Số điện thoại:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {user.phone || 'Chưa cập nhật'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Ngày sinh:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {formatDate(user.dateOfBirth)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Giới tính:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : user.gender || 'Chưa cập nhật'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <LocationIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Địa chỉ:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {user.address || 'Chưa cập nhật'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Professional Info */}
        {(user.role === 'dentist' || user.specialization || user.description) && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <WorkIcon color="primary" />
                  <Typography variant="h6" component="h3">
                    Thông tin chuyên môn
                  </Typography>
                </Box>

                {user.role === 'dentist' && user.specialization && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Chuyên môn:
                    </Typography>
                    <Typography variant="body1">
                      {user.specialization}
                    </Typography>
                  </Box>
                )}

                {user.description && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Mô tả:
                    </Typography>
                    <Typography variant="body1">
                      {user.description}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderSystemInfo = () => {
    if (!user) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DescriptionIcon color="primary" />
                <Typography variant="h6" component="h3">
                  Thông tin hệ thống
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Ngày tạo tài khoản:
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(user.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Cập nhật lần cuối:
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(user.updatedAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    ID người dùng:
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {user._id}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Trạng thái tài khoản:
                  </Typography>
                  <Chip
                    label={user.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                    color={user.isActive ? 'success' : 'error'}
                    variant="filled"
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderCertificates = () => {
    if (!user || user.role !== 'dentist' || !user.certificates || user.certificates.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Chưa có chứng chỉ nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === 'dentist' ? 'Nha sĩ này chưa upload chứng chỉ' : 'Chỉ nha sĩ mới có chứng chỉ'}
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {user.certificates.map((cert, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={cert.isVerified ? 'Đã xác thực' : 'Chờ xác thực'}
                    color={cert.isVerified ? 'success' : 'warning'}
                    variant="filled"
                    size="small"
                  />
                </Box>
                
                {cert.imageUrl && (
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={cert.imageUrl}
                      alt={`Chứng chỉ ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                      }}
                    />
                  </Box>
                )}

                {cert.notes && (
                  <Typography variant="body2" color="text.secondary">
                    {cert.notes}
                  </Typography>
                )}

                {cert.verifiedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Xác thực: {formatDateTime(cert.verifiedAt)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Chi tiết nhân viên
          </Typography>
          <Box>
            <IconButton onClick={onEdit} color="primary" sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {user && (
          <>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="Thông tin cơ bản" />
                <Tab label="Thông tin hệ thống" />
                {user.role === 'dentist' && <Tab label="Chứng chỉ" />}
              </Tabs>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && renderBasicInfo()}
            {activeTab === 1 && renderSystemInfo()}
            {activeTab === 2 && user.role === 'dentist' && renderCertificates()}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDetailModal;
