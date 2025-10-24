/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Tag, 
  Modal, 
  Form, 
  Switch,
  Avatar,
  Row,
  Col,
  Tooltip,
  Steps,
  Radio,
  Alert,
  DatePicker,
  Tabs
} from 'antd';
import { 
  UserSwitchOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { toast } from '../../services/toastService';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { userService } from '../../services/userService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { canManageUsers } from '../Common/PermissionGuard.jsx';
import SearchBar from '../Common/SearchBar.jsx';
import { 
  searchAndFilter, 
  createRoleFilter, 
  debounce 
} from '../../utils/searchUtils.js';
import { 
  handleFullNameFormat,
  getAntDesignFormRules
} from '../../utils/validationUtils.js';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' hoặc 'inactive'
  const [sortConfig, setSortConfig] = useState({
    field: null,
    order: null
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  // Toggle confirmation modal states
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedUserForToggle, setSelectedUserForToggle] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []); // Chỉ load một lần khi component mount

  // Debounced search effect
  useEffect(() => {
    const debouncedSearch = debounce(() => {
      applySearchAndFilter();
    }, 300);
    
    debouncedSearch();
  }, [searchTerm, filters, users, activeTab, sortConfig]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Load tất cả users để có thể search linh hoạt
      const response = await userService.getAllStaff(1, 1000); // Load max 1000 users
      
      const allUsers = response.users || [];
      setUsers(allUsers);
      
      // Cập nhật pagination với tổng số users
      setPagination(prev => ({
        ...prev,
        total: allUsers.length
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const applySearchAndFilter = () => {
    const searchFields = ['fullName', 'email', 'phone', 'employeeCode'];
    
    // Filter users theo trạng thái trước
    const statusFilteredUsers = users.filter(user => {
      if (activeTab === 'active') {
        return user.isActive === true;
      } else {
        return user.isActive === false;
      }
    });
    
    // Sau đó apply search và filter khác
    let filtered = searchAndFilter(statusFilteredUsers, searchTerm, searchFields, filters);
    
    // Apply sorting nếu có
    if (sortConfig.field && sortConfig.order) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.field];
        let bValue = b[sortConfig.field];
        
        // Xử lý các trường hợp đặc biệt
        if (sortConfig.field === 'fullName') {
          aValue = a.fullName?.toLowerCase() || '';
          bValue = b.fullName?.toLowerCase() || '';
        } else if (sortConfig.field === 'email') {
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
        } else if (sortConfig.field === 'updatedAt') {
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
        } else if (sortConfig.field === 'dateOfBirth') {
          aValue = new Date(a.dateOfBirth );
          bValue = new Date(b.dateOfBirth);
        } else if (sortConfig.field === 'role') {
          // Sắp xếp theo thứ tự ưu tiên vai trò
          const roleOrder = { admin: 1, manager: 2, dentist: 3, nurse: 4, receptionist: 5, patient: 6 };
          aValue = roleOrder[a.role];
          bValue = roleOrder[b.role];
        }
        
        if (aValue < bValue) {
          return sortConfig.order === 'ascend' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.order === 'ascend' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredUsers(filtered);
    
    // Reset về page 1 khi có search/filter/sort mới để user thấy kết quả
    if (searchTerm || Object.keys(filters).length > 0 || sortConfig.field) {
      setPagination(prev => ({
        ...prev,
        current: 1
      }));
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    // Handle sorting
    if (sorter && sorter.field) {
      setSortConfig({
        field: sorter.field,
        order: sorter.order
      });
    } else {
      setSortConfig({
        field: null,
        order: null
      });
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Prepare data for export based on table column order
      const exportData = filteredUsers.map(user => {
        const rowData = {};
        
        // Add data in the same order as table columns
        columns.forEach(column => {
          switch (column.key) {
            case 'avatar':
              // Skip avatar column in Excel
              break;
            case 'fullName':
              rowData['Họ và tên'] = user.fullName || '';
              break;
            case 'email':
              rowData['Email'] = user.email || '';
              break;
            case 'phone':
              rowData['Số điện thoại'] = user.phone || '';
              break;
            case 'dateOfBirth':
              rowData['Ngày sinh'] = user.dateOfBirth ? dayjs(user.dateOfBirth).format('DD/MM/YYYY') : '-';
              break;
            case 'role':
              rowData['Vai trò'] = getRoleText(user.role);
              break;
            case 'updatedAt':
              rowData['Ngày cập nhật'] = user.updatedAt ? dayjs(user.updatedAt).format('DD/MM/YYYY HH:mm') : '';
              break;
            case 'actions':
              // Skip actions column in Excel
              break;
            default:
              // Add employee code if not in columns but needed
              if (!rowData['Mã nhân viên'] && user.employeeCode) {
                rowData['Mã nhân viên'] = user.employeeCode;
              }
              break;
          }
        });
        
        // Add employee code at the beginning if not already added
        if (user.employeeCode && !rowData['Mã nhân viên']) {
          const newRowData = { 'Mã nhân viên': user.employeeCode };
          Object.keys(rowData).forEach(key => {
            newRowData[key] = rowData[key];
          });
          return newRowData;
        }
        
        return rowData;
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths dynamically based on actual columns
      const colWidths = [];
      columns.forEach(column => {
        switch (column.key) {
          case 'avatar':
            // Skip avatar
            break;
          case 'fullName':
            colWidths.push({ wch: 25 }); // Họ và tên
            break;
          case 'email':
            colWidths.push({ wch: 30 }); // Email
            break;
          case 'phone':
            colWidths.push({ wch: 15 }); // Số điện thoại
            break;
          case 'dateOfBirth':
            colWidths.push({ wch: 12 }); // Ngày sinh
            break;
          case 'role':
            colWidths.push({ wch: 15 }); // Vai trò
            break;
          case 'updatedAt':
            colWidths.push({ wch: 20 }); // Ngày cập nhật
            break;
          case 'actions':
            // Skip actions
            break;
        }
      });
      
      // Add employee code width at the beginning if it exists
      if (exportData.length > 0 && exportData[0]['Mã nhân viên']) {
        colWidths.unshift({ wch: 15 }); // Mã nhân viên
      }
      
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách nhân viên');

      // Generate filename with current date
      const currentDate = dayjs().format('DD-MM-YYYY');
      const tabName = activeTab === 'active' ? 'Dang-lam-viec' : 'Da-nghi-viec';
      const filename = `Danh-sach-nhan-vien-${tabName}-${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success(`Đã xuất file Excel thành công: ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  // Helper functions for export
  const getRoleText = (role) => {
    const roleMap = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      dentist: 'Nha sĩ',
      nurse: 'Y tá',
      receptionist: 'Lễ tân',
      patient: 'Bệnh nhân'
    };
    return roleMap[role] || role;
  };

  const getGenderText = (gender) => {
    const genderMap = {
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác'
    };
    return genderMap[gender] || '';
  };

  const handleEdit = (user) => {
    // Navigate to edit page instead of opening modal
    navigate(`/dashboard/users/edit/${user._id}`);
  };

  const handleView = (user) => {
    // Navigate to detail page instead of opening modal
    navigate(`/dashboard/users/detail/${user._id}`);
  };

  // Handle show delete confirmation modal
  const handleDelete = (user) => {
    setSelectedUserForDelete(user);
    setShowDeleteModal(true);
  };

  // Handle confirm delete user
  const handleConfirmDelete = async () => {
    if (!selectedUserForDelete) return;
    
    try {
      setDeleteLoading(true);
      await userService.deleteUser(selectedUserForDelete._id);
      toast.success(`Đã xóa nhân viên "${selectedUserForDelete.fullName}" thành công!`);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa nhân viên thất bại');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedUserForDelete(null);
    }
  };

  // Handle cancel delete confirmation
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedUserForDelete(null);
  };

  // Handle show toggle confirmation modal
  const handleToggleStatus = (user) => {
    setSelectedUserForToggle(user);
    setShowToggleModal(true);
  };

  // Handle confirm toggle user status
  const handleConfirmToggle = async () => {
    if (!selectedUserForToggle) return;
    
    try {
      setToggleLoading(true);
      await userService.toggleUserStatus(selectedUserForToggle._id);
      const newStatus = selectedUserForToggle.isActive ? 'khóa tài khoản' : 'mở khóa tài khoản';
      toast.success(`Đã ${newStatus} nhân viên "${selectedUserForToggle.fullName}" thành công!`);
      
      // Reload users để cập nhật UI
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Lỗi khi thay đổi trạng thái nhân viên!');
    } finally {
      setToggleLoading(false);
      setShowToggleModal(false);
      setSelectedUserForToggle(null);
    }
  };

  // Handle cancel toggle confirmation
  const handleCancelToggle = () => {
    setShowToggleModal(false);
    setSelectedUserForToggle(null);
  };

  const handleUpdate = async (values) => {
    try {
      if (selectedUser) {
        // Edit user - update profile information
        const {...formData } = values;
        const updateData = {
          ...formData,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
          specialties: values.specialties || [] // 🆕 Include specialties
        };

        const response = await fetch(`http://localhost:3001/api/user/update/${selectedUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          toast.success('Cập nhật thông tin thành công');
        } else {
          const error = await response.json();
          toast.error(error.message || 'Cập nhật thông tin thất bại');
          return;
        }
      } else {
        // 🆕 Nhiệm vụ 3.1: Create staff without OTP using userService.createStaff
        const staffData = {
          email: values.email,
          phone: values.phone,
          fullName: values.fullName,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
          gender: values.gender,
          role: values.role,
          specialties: values.specialties || [], // Multi-specialty support
          isActive: values.isActive !== undefined ? values.isActive : true,
          description: values.description || ''
        };

        const result = await userService.createStaff(staffData);
        
        if (result.success) {
          // Show success with employeeCode
          Modal.success({
            title: 'Tạo nhân viên thành công!',
            content: (
              <div>
                <p><strong>Mã nhân viên:</strong> {result.employeeCode}</p>
                <p><strong>Mật khẩu mặc định:</strong> {result.defaultPassword}</p>
                <p style={{ color: '#ff4d4f', marginTop: '12px' }}>
                  ⚠️ Nhân viên sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
                </p>
              </div>
            ),
            okText: 'Đóng'
          });
          
          // Reload users
          loadUsers();
        } else {
          toast.error(result.message || 'Thêm nhân viên thất bại');
          return;
        }
      }
      
      setModalVisible(false);
      form.resetFields();
      setCurrentStep(0);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Thao tác thất bại');
    }
  };

  const getRoleTag = (role) => {
    const roleConfig = {
      admin: { color: 'red', text: 'Quản trị viên' },
      manager: { color: 'orange', text: 'Quản lý' },
      dentist: { color: 'blue', text: 'Nha sĩ' },
      nurse: { color: 'green', text: 'Y tá' },
      receptionist: { color: 'purple', text: 'Lễ tân' },
      patient: { color: 'default', text: 'Bệnh nhân' }
    };
    
    const config = roleConfig[role] || { color: 'default', text: role };
    return <Tag color={config.color} style={{ fontSize: '16px' }}>{config.text}</Tag>;
  };


  const columns = [
    {
      title: '',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar) => (
        <Avatar 
          src={avatar} 
          icon={<UserOutlined />}
          size="large"
        />
      )
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.employeeCode && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.employeeCode}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      render: (text) => <Text copyable={{ text }}>{text}</Text>
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      sorter: true,
      render: (text) => <Text copyable={{ text }}>{text}</Text>
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      sorter: true,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      sorter: true,
      render: (role) => getRoleTag(role)
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        // 🆕 Task 3.5: Check permission to manage this user
        const canManage = canManageUsers(currentUser, record);
        
        return (
          <Space>
            <Tooltip title="Xem chi tiết">
              <Button 
                type="text" 
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
              />
            </Tooltip>
            <Tooltip title={canManage ? "Chỉnh sửa" : "Không có quyền chỉnh sửa"}>
              <Button 
                type="text" 
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                disabled={!canManage}
              />
            </Tooltip>
            <Tooltip title={
              !canManage 
                ? "Không có quyền thay đổi trạng thái"
                : record.isActive 
                  ? 'Nhân viên nghỉ việc (Khóa tài khoản)' 
                  : 'Mở khóa tài khoản'
            }>
              <Switch
                size="small"
                checked={record.isActive}
                onChange={() => handleToggleStatus(record)}
                checkedChildren="Mở"
                unCheckedChildren="Khóa"
                disabled={!canManage}
              />
            </Tooltip>
            <Tooltip title={canManage ? "Xóa nhân viên" : "Không có quyền xóa"}>
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
                disabled={!canManage}
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  if (!['admin', 'manager'].includes(currentUser?.role)) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3} style={{ color: '#ff4d4f' }}>
          Không có quyền truy cập
        </Title>
        <Text type="secondary">
          Chỉ admin và manager mới có thể truy cập trang này
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <SearchBar
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        placeholder="       Tìm kiếm theo tên, email, số điện thoại, mã nhân viên..."
        filters={[
          createRoleFilter()
        ]}
        searchValue={searchTerm}
        filterValues={filters}
        loading={loading}
        cardStyle={{
          marginBottom: '24px'
        }}
      />

      {/* Users Table with Tabs */}
      <Card>
        <div style={{marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', gap:10}}>
            <UserSwitchOutlined style={{fontSize: 18, color: '#1890ff'}}/>
            <Title level={4} style={{margin:0, fontSize:16}}>Danh sách nhân viên</Title>
          </div>  
          <Space>
            <Button 
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
              size="large"
              style={{
                borderRadius: '8px',
                border: '1px solid #52c41a',
                color: '#52c41a',
                background: '#f6ffed'
              }}
            >
              Xuất Excel
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedUser(null);
                form.resetFields();
                setModalVisible(true);
              }}
              size="large"
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2596be 0%, #40a9ff 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(37, 150, 190, 0.3)',
                fontWeight: '600'
              }}
            >
              Thêm nhân viên
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'active',
              label: (
                <span>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  Đang làm việc
                </span>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={filteredUsers}
                  rowKey="_id"
                  loading={loading}
                  onChange={handleTableChange}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: filteredUsers.length,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} của ${total} nhân viên đang làm việc`,
                    onChange: (page, pageSize) => {
                      setPagination(prev => ({
                        ...prev,
                        current: page,
                        pageSize: pageSize || prev.pageSize
                      }));
                    }
                  }}
                  scroll={{ x: 1000 }}
                />
              )
            },
            {
              key: 'inactive',
              label: (
                <span>
                  <UserSwitchOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  Đã nghỉ việc
                </span>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={filteredUsers}
                  rowKey="_id"
                  loading={loading}
                  onChange={handleTableChange}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: filteredUsers.length,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} của ${total} nhân viên đã nghỉ việc`,
                    onChange: (page, pageSize) => {
                      setPagination(prev => ({
                        ...prev,
                        current: page,
                        pageSize: pageSize || prev.pageSize
                      }));
                    }
                  }}
                  scroll={{ x: 1000 }}
                />
              )
            }
          ]}
        />
      </Card>
      
      <Modal
        title={selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm nhân viên mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setCurrentStep(0);
        }}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <div style={{ 
          padding: '20px',
          background: 'white'
        }}>
              <Typography.Title level={2} style={{ 
                textAlign: 'center', 
                marginBottom: '40px', 
                color: '#2596be',
                fontSize: '2.5rem',
                fontWeight: 'bold'
              }}>
                {selectedUser ? 'CHỈNH SỬA' : 'THÊM MỚI'}
              </Typography.Title>

              {/* Steps */}
              <Steps 
                current={currentStep} 
                items={selectedUser ? [
                  {
                    title: 'Thông tin cá nhân',
                    description: 'Nhập thông tin cơ bản',
                  },
                  {
                    title: 'Thông tin công việc',
                    description: 'Vai trò, Chuyên khoa, Trạng thái',
                  }
                ] : [
                  {
                    title: 'Thông tin cá nhân',
                    description: 'Nhập thông tin cơ bản',
                  },
                  {
                    title: 'Thông tin công việc',
                    description: 'Vai trò, Chuyên khoa, Trạng thái',
                  }
                ]}
                style={{ marginBottom: '40px' }}
              />

              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdate}
              >
                {/* 🆕 Step 1: Personal Information (was Step 3) */}
                {currentStep === 0 && (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="email"
                          label="Email"
                          rules={getAntDesignFormRules.email()}
                        >
                          <Input placeholder="Nhập email của nhân viên" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="phone"
                          label="Số điện thoại"
                          rules={getAntDesignFormRules.phone()}
                        >
                          <Input placeholder="Nhập số điện thoại" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="fullName"
                          label="Họ và tên"
                          rules={getAntDesignFormRules.fullName()}
                        >
                          <Input 
                            placeholder="Nhập họ và tên" 
                            onBlur={(e) => handleFullNameFormat(e, (field, value) => form.setFieldsValue({ [field]: value }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="dateOfBirth"
                          label="Ngày sinh"
                          rules={getAntDesignFormRules.dateOfBirthEmployee()}
                        >
                          <DatePicker 
                            style={{ width: '100%' }}
                            placeholder="Chọn ngày sinh"
                            format="DD/MM/YYYY"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="gender"
                          label="Giới tính"
                          rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                        >
                          <Radio.Group>
                            <Space direction="horizontal" size="large">
                              <Radio value="male">Nam</Radio>
                              <Radio value="female">Nữ</Radio>
                              <Radio value="other">Khác</Radio>
                            </Space>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '24px' }}>
                      <Button
                        type="primary"
                        onClick={() => {
                          form.validateFields(['email', 'phone', 'fullName', 'dateOfBirth', 'gender'])
                            .then(() => setCurrentStep(1))
                            .catch((err) => console.log('Validation failed:', err));
                        }}
                        block
                        style={{
                          background: '#2596be',
                          border: 'none',
                          borderRadius: '8px',
                          height: '48px'
                        }}
                      >
                        Tiếp theo
                      </Button>
                    </Space>
                  </div>
                )}

                {/* 🆕 Step 2: Work Information (was Step 4) */}
                {currentStep === 1 && (
                  <div>
                    <Alert
                      message="Lưu ý về mật khẩu"
                      description="Mật khẩu mặc định sẽ được tự động tạo bằng mã nhân viên. Nhân viên sẽ phải đổi mật khẩu khi đăng nhập lần đầu."
                      type="info"
                      showIcon
                      style={{ marginBottom: '24px' }}
                    />
                    
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="role"
                          label="Vai trò"
                          rules={getAntDesignFormRules.role()}
                        >
                          <Select 
                            placeholder="Chọn vai trò"
                            onChange={(value) => {
                              // Clear specialties if role changes to non-dentist
                              if (value !== 'dentist') {
                                form.setFieldsValue({ specialties: [] });
                              }
                            }}
                          >
                            <Option value="admin">Quản trị viên</Option>
                            <Option value="manager">Quản lý</Option>
                            <Option value="dentist">Nha sĩ</Option>
                            <Option value="nurse">Y tá</Option>
                            <Option value="receptionist">Lễ tân</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      
                      {/* 🆕 Nhiệm vụ 3.1: Specialties field (dentist only) */}
                      <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => {
                          const role = getFieldValue('role');
                          return role === 'dentist' ? (
                            <Col xs={24} sm={12}>
                              <Form.Item
                                name="specialties"
                                label="Chuyên khoa"
                                rules={[{ 
                                  required: true, 
                                  message: 'Vui lòng chọn ít nhất 1 chuyên khoa!' 
                                }]}
                              >
                                <Select
                                  mode="multiple"
                                  placeholder="Chọn chuyên khoa (có thể chọn nhiều)"
                                  options={[
                                    { label: 'Chỉnh nha', value: 'Chỉnh nha' },
                                    { label: 'Răng sứ thẩm mỹ', value: 'Răng sứ thẩm mỹ' },
                                    { label: 'Implant', value: 'Implant' },
                                    { label: 'Nội nha', value: 'Nội nha' },
                                    { label: 'Phục hồi', value: 'Phục hồi' },
                                    { label: 'Nha chu', value: 'Nha chu' },
                                    { label: 'Tổng quát', value: 'Tổng quát' }
                                  ]}
                                />
                              </Form.Item>
                            </Col>
                          ) : null;
                        }}
                      </Form.Item>
                      
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="isActive"
                          label="Trạng thái"
                          initialValue={true}
                        >
                          <Select placeholder="Chọn trạng thái">
                            <Option value={true}>Hoạt động</Option>
                            <Option value={false}>Không hoạt động</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col xs={24}>
                        <Form.Item
                          name="description"
                          label="Mô tả"
                          rules={getAntDesignFormRules.description()}
                        >
                          <Input.TextArea rows={3} placeholder="Nhập mô tả..." />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '24px' }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        style={{
                          background: '#2596be',
                          border: 'none',
                          borderRadius: '8px',
                          height: '48px'
                        }}
                      >
                        {selectedUser ? 'Cập nhật' : 'Tạo nhân viên'}
                      </Button>

                      <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => setCurrentStep(0)}
                        block
                        style={{
                          borderRadius: '8px',
                          height: '48px'
                        }}
                      >
                        Quay lại
                      </Button>
                    </Space>
                  </div>
                )}
              </Form>
        </div>
      </Modal>

      {/* Toggle Status Modal */}
      <Modal
        title={`${selectedUserForToggle?.isActive ? 'Khóa tài khoản nhân viên' : 'Mở khóa tài khoản nhân viên'}`}
        open={showToggleModal}
        onOk={handleConfirmToggle}
        onCancel={handleCancelToggle}
        confirmLoading={toggleLoading}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        okType={selectedUserForToggle?.isActive ? 'danger' : 'primary'}
        centered
        width={520}
      >
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          {selectedUserForToggle?.isActive ? (
            <>
              Bạn có chắc chắn muốn <strong style={{ color: '#ff4d4f' }}>khóa tài khoản</strong> của nhân viên{' '}
              <strong>{selectedUserForToggle?.employeeCode}| {selectedUserForToggle?.fullName}</strong> ?
            </>
          ) : (
            <>
              Bạn có chắc chắn muốn <strong style={{ color: '#52c41a' }}>mở khóa tài khoản</strong> của nhân viên{' '}
              <strong>{selectedUserForToggle?.employeeCode}| {selectedUserForToggle?.fullName}</strong>
              ?
            </>
          )}
        </p>
        
        {selectedUserForToggle?.isActive && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fff2e8', 
            borderLeft: '4px solid #ff7a00',
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <p style={{ margin: 0, color: '#d46b08', fontWeight: '500' }}>
             <strong>Lưu ý:</strong> Nhân viên này sẽ:
            </p>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#d46b08' }}>
              <li>Không thể đăng nhập vào hệ thống</li>
              <li>Mất quyền truy cập tất cả chức năng</li>
              <li>Trạng thái chuyển thành "Đã nghỉ việc"</li>
            </ul>
          </div>
        )}
        
        {!selectedUserForToggle?.isActive && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f6ffed', 
            borderLeft: '4px solid #52c41a',
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <p style={{ margin: 0, color: '#389e0d', fontWeight: '500' }}>
              <strong>Nhân viên này sẽ:</strong>
            </p>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#389e0d' }}>
              <li>Có thể đăng nhập vào hệ thống</li>
              <li>Được khôi phục quyền truy cập đầy đủ</li>
              <li>Trạng thái chuyển thành "Đang làm việc"</li>
            </ul>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa nhân viên"
        open={showDeleteModal}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmLoading={deleteLoading}
        okText="Xóa nhân viên"
        cancelText="Hủy bỏ"
        okType="danger"
        centered
        width={520}
      >
        {selectedUserForDelete && (
          <div>
            <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
              Bạn có chắc chắn muốn <strong style={{ color: '#ff4d4f' }}>xóa nhân viên</strong>{' '}
              <strong>{selectedUserForDelete.employeeCode} | {selectedUserForDelete.fullName}</strong>
              ?
            </p>
            
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#fff2f0', 
              borderLeft: '4px solid #ff4d4f',
              borderRadius: '6px',
              marginTop: '16px'
            }}>
              <p style={{ margin: 0, color: '#cf1322', fontWeight: '500' }}>
                 <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
              </p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#cf1322' }}>
                <li>Tất cả dữ liệu của nhân viên sẽ bị xóa vĩnh viễn</li>
              </ul>
            </div>
            
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f6ffed', 
              borderLeft: '4px solid #52c41a',
              borderRadius: '6px',
              marginTop: '12px'
            }}>
              <p style={{ margin: 0, color: '#389e0d', fontSize: '14px' }}>
                 <strong>Gợi ý:</strong> Nếu chỉ muốn tạm ngưng làm việc, hãy sử dụng chức năng "Khóa tài khoản" thay vì xóa.
              </p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default UserManagement;
