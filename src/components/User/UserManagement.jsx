import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Grid,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  LocalHospital as DentistIcon,
  HealthAndSafety as NurseIcon,
  SupportAgent as ReceptionistIcon
} from '@mui/icons-material';
import { userService } from '../../services/userService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Fetch users
  const fetchUsers = async (page = 1, role = '', search = '') => {
    setLoading(true);
    try {
      let response;
      if (role) {
        response = await userService.getUsersByRole(role, page, 10);
      } else if (search) {
        response = await userService.searchStaff({ fullName: search }, page, 10);
      } else {
        response = await userService.getAllStaff(page, 10);
      }
      
      setUsers(response.users);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, selectedRole, searchTerm);
  }, [selectedRole]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, selectedRole, searchTerm);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await userService.deleteUser(userId);
        fetchUsers(currentPage, selectedRole, searchTerm);
        setSnackbar({ open: true, message: 'Xóa người dùng thành công!', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Có lỗi xảy ra khi xóa người dùng', severity: 'error' });
      }
    }
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
      patient: { 
        name: 'Bệnh nhân', 
        color: 'default', 
        icon: <PersonIcon /> 
      },
    };
    return configs[role] || configs.patient;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
              Quản lý nhân viên
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Quản lý thông tin và quyền hạn nhân viên
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddUser(true)}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              }
            }}
          >
            Thêm nhân viên
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Tìm kiếm theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            {/* Role filter */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  label="Vai trò"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon color="action" />
                    </InputAdornment>
                  }
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Tất cả vai trò</MenuItem>
                  <MenuItem value="admin">Quản trị viên</MenuItem>
                  <MenuItem value="manager">Quản lý</MenuItem>
                  <MenuItem value="dentist">Nha sĩ</MenuItem>
                  <MenuItem value="nurse">Y tá</MenuItem>
                  <MenuItem value="receptionist">Lễ tân</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Export button */}
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Xuất Excel
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Đang tải...
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Nhân viên
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Vai trò
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Liên hệ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Trạng thái
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Ngày tạo
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  return (
                    <TableRow 
                      key={user._id} 
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={user.avatar}
                            sx={{ width: 40, height: 40, mr: 2 }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {user.fullName}
                            </Typography>
                            {user.employeeCode && (
                              <Typography variant="caption" color="text.secondary">
                                {user.employeeCode}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={roleConfig.icon}
                          label={roleConfig.name}
                          color={roleConfig.color}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">{user.email}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {user.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                          color={user.isActive ? 'success' : 'error'}
                          variant="filled"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton size="small" color="primary">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton size="small" color="success">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {currentUser.role === 'admin' && user._id !== currentUser._id && (
                            <Tooltip title="Xóa">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: 1, borderColor: 'divider' }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, page) => fetchUsers(page, selectedRole, searchTerm)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onClose={() => setShowAddUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Thêm nhân viên mới
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Tính năng này đang được phát triển. Hiện tại nhân viên có thể đăng ký tài khoản thông qua trang đăng ký.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddUser(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;