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
  // message, // Replaced with toast service 
  Popconfirm,
  Avatar,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
  Badge,
  Steps,
  Radio,
  Alert,
  Tabs,
  DatePicker
} from 'antd';
import { 
  HeartOutlined,
  StarOutlined,
  TeamOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { toast } from '../../services/toastService';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { userService } from '../../services/userService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser, sendOtpRegister, verifyOtp, error: authError, clearError } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    isActive: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [formData, setFormData] = useState({}); // Lưu dữ liệu từ các steps


  // Debug step changes
  React.useEffect(() => {
    console.log('UserManagement: Current step changed to:', currentStep);
  }, [currentStep]);

  useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllStaff(
        pagination.current, 
        pagination.pageSize
      );
      
      setUsers(response.users || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleEdit = (user) => {
    // Navigate to edit page instead of opening modal
    navigate(`/users/edit/${user._id}`);
  };

  const handleView = (user) => {
    // Navigate to detail page instead of opening modal
    navigate(`/users/detail/${user._id}`);
  };

  const handleDelete = async (userId) => {
    try {
      await userService.deleteUser(userId);
      toast.success('Xóa người dùng thành công');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa người dùng thất bại');
    }
  };

  const handleUpdate = async (values) => {
    try {
      if (selectedUser) {
        // CHỈNH SỬA USER - Không cần OTP, chỉ cần thông tin từ form
        // Loại bỏ certificates khỏi dữ liệu update vì certificates được quản lý riêng
        const {...formData } = values;
        const updateData = {
          ...formData,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
        };
        
        console.log('UserManagement: Editing user:', selectedUser._id);
        console.log('UserManagement: Update data:', updateData);
        
        // Sử dụng API update profile của backend
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
        // THÊM USER MỚI - Cần OTP verification
        const step4Data = form.getFieldsValue();
        
        // Kết hợp dữ liệu từ tất cả các steps
        const registerData = {
          ...formData, // Dữ liệu từ step 3 đã lưu
          ...step4Data, // Dữ liệu từ step 4
          email: email, // Email từ step 1
          role: step4Data.role || 'patient',
          dateOfBirth: step4Data.dateOfBirth ? step4Data.dateOfBirth.format('YYYY-MM-DD') : formData.dateOfBirth ? formData.dateOfBirth.format('YYYY-MM-DD') : null
        };
        
        console.log('UserManagement: Adding new user');
        console.log('UserManagement: Step 3 data (formData):', formData);
        console.log('UserManagement: Step 4 data (step4Data):', step4Data);
        console.log('UserManagement: Email from step 1:', email);
        console.log('UserManagement: Final registerData:', registerData);
        
        const response = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData)
        });
        
        if (response.ok) {
          toast.success('Thêm nhân viên thành công');
        } else {
          const error = await response.json();
          toast.error(error.message || 'Thêm nhân viên thất bại');
          return;
        }
      }
      
      setModalVisible(false);
      form.resetFields();
      setCurrentStep(0);
      setEmail('');
      setOtpSent(false);
      setOtpMessage('');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
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

  const getStatusTag = (isActive) => {
    return isActive ? (
      <Tag color="green" style={{ fontSize: '16px' }}>Hoạt động</Tag>
    ) : (
      <Tag color="red" style={{ fontSize: '16px' }}>Không hoạt động</Tag>
    );
  };

  const columns = [
    {
      title: '',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar, record) => (
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
      render: (text) => <Text copyable={{ text }}>{text}</Text>
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => <Text copyable={{ text }}>{text}</Text>
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => getStatusTag(isActive)
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
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
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Quản lý nhân viên
        </Title>
      </div>

      {/* Modern Filters Toolbar */}
      <Card 
        style={{ 
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row gutter={[20, 16]} align="middle">
          {/* Search Input - Thống nhất với filter khác */}
          <Col xs={24} sm={12} lg={8}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '4px',
                fontWeight: '500',
                height: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <div style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    color: '#2596be',
                    fontSize: '16px'
                  }}>
                    <SearchOutlined />
                  </div>
                  <Input
                    placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                    onPressEnter={(e) => handleSearch(e.target.value)}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        handleSearch('');
                      }
                    }}
                    style={{ 
                      width: '100%',
                      borderRadius: '8px',
                      paddingLeft: '40px',
                      height: '40px',
                      border: '2px solid #e8e8e8',
                      fontSize: '14px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2596be';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e8e8';
                    }}
                  />
                </div>
              </div>
            </div>
          </Col>
          
          {/* Role Filter - Căn chỉnh đồng đều */}
          <Col xs={12} sm={6} lg={4}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '4px',
                fontWeight: '500',
                height: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                Lọc theo vai trò
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Select
                  style={{ 
                    width: '100%',
                    borderRadius: '8px'
                  }}
                  value={filters.role}
                  onChange={(value) => handleFilterChange('role', value)}
                  allowClear
                  size="large"
                  suffixIcon={<FilterOutlined style={{ color: '#2596be' }} />}
                >
                  <Option value="admin">Quản trị viên</Option>
                  <Option value="manager">Quản lý</Option>
                  <Option value="dentist">Nha sĩ</Option>
                  <Option value="nurse">Y tá</Option>
                  <Option value="receptionist">Lễ tân</Option>
                </Select>
              </div>
            </div>
          </Col>
          
          {/* Status Filter - Căn chỉnh đồng đều */}
          <Col xs={12} sm={6} lg={4}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '4px',
                fontWeight: '500',
                height: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                Lọc theo trạng thái
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Select
                  style={{ 
                    width: '100%',
                    borderRadius: '8px'
                  }}
                  value={filters.isActive}
                  onChange={(value) => handleFilterChange('isActive', value)}
                  allowClear
                  size="large"
                  suffixIcon={<FilterOutlined style={{ color: '#2596be' }} />}
                >
                  <Option value="true">Hoạt động</Option>
                  <Option value="false">Không hoạt động</Option>
                </Select>
              </div>
            </div>
          </Col>
          
          {/* Action Buttons - Loại bỏ nút refresh */}
          <Col xs={24} sm={24} lg={8} style={{ textAlign: 'right' }}>
            <Space size="middle" wrap>
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
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} người dùng`,
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
      </Card>
      
      <Modal
        title={selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm nhân viên mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setCurrentStep(0);
          setEmail('');
          setOtpSent(false);
          setOtpMessage('');
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
                  // EDIT MODE - Chỉ có 2 steps
                  {
                    title: 'Thông tin cá nhân',
                    description: 'Nhập thông tin cơ bản',
                  },
                  {
                    title: 'Thông tin công việc',
                    description: 'Vai trò, Loại công việc, Trạng thái',
                  }
                ] : [
                  // ADD MODE - Có 4 steps với OTP
                  {
                    title: 'Xác thực Email',
                    description: 'Nhập email để nhận mã OTP',
                  },
                  {
                    title: 'Xác thực OTP',
                    description: 'Nhập mã OTP để xác thực',
                  },
                  {
                    title: 'Thông tin cá nhân',
                    description: 'Nhập thông tin cơ bản',
                  },
                  {
                    title: 'Thông tin công việc',
                    description: 'Vai trò, Loại công việc, Trạng thái',
                  }
                ]}
                style={{ marginBottom: '40px' }}
              />

              {/* Success Alerts */}
              {otpSent && currentStep === 1 && (
                <Alert
                  message={otpMessage || "OTP đã được gửi đến email!"}
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  style={{ marginBottom: '24px' }}
                />
              )}

              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdate}
              >
                {/* Step 1: Email Verification - Chỉ hiển thị khi thêm mới */}
                {!selectedUser && currentStep === 0 && (
                  <div>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: 'Vui lòng nhập email!' },
                        { type: 'email', message: 'Email không hợp lệ!' }
                      ]}
                    >
                      <Input placeholder="Nhập email của nhân viên" />
                    </Form.Item>

                    <Button
                      type="primary"
                      onClick={async () => {
                        const emailValue = form.getFieldValue('email');
                        if (emailValue) {
                          try {
                            console.log('UserManagement: Starting send OTP for email:', emailValue);
                            setLocalLoading(true);
                            // Sử dụng fetch trực tiếp để tránh global loading
                            const response = await fetch('http://localhost:3001/api/auth/send-otp-register', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ email: emailValue })
                            });
                            
                            if (response.ok) {
                              const data = await response.json();
                              console.log('UserManagement: OTP response:', data);
                              setEmail(emailValue);
                              setOtpMessage(data.message || 'OTP đã được gửi đến email!');
                              setOtpSent(true);
                              console.log('UserManagement: About to setCurrentStep(1)');
                              setCurrentStep(1);
                              console.log('UserManagement: setCurrentStep(1) called');
                            } else {
                              const error = await response.json();
                              toast.error(error.message || 'Gửi OTP thất bại!');
                            }
                            setLocalLoading(false);
                          } catch (error) {
                            console.error('Error sending OTP:', error);
                            toast.error('Có lỗi xảy ra khi gửi OTP!');
                            setLocalLoading(false);
                          }
                        }
                      }}
                      loading={localLoading}
                      block
                      style={{
                        background: '#2596be',
                        border: 'none',
                        borderRadius: '8px',
                        height: '48px'
                      }}
                    >
                      {localLoading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
                    </Button>
                  </div>
                )}

                {/* Step 2: OTP Verification - Chỉ hiển thị khi thêm mới */}
                {!selectedUser && currentStep === 1 && (
                  <div>
                    <Form.Item
                      name="otp"
                      label="Mã OTP"
                      rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
                    >
                      <Input 
                        placeholder="Nhập 6 chữ số OTP"
                        maxLength={6}
                        style={{ 
                          textAlign: 'center', 
                          fontSize: '18px', 
                          letterSpacing: '4px'
                        }}
                      />
                    </Form.Item>

                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Button
                        type="primary"
                        onClick={async () => {
                          const otpValue = form.getFieldValue('otp');
                          if (otpValue) {
                            try {
                              // Sử dụng fetch trực tiếp để tránh global loading
                              const response = await fetch('http://localhost:3001/api/auth/verify-otp-register', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                  email: email, 
                                  otp: otpValue 
                                })
                              });
                              
                              if (response.ok) {
                                setCurrentStep(2);
                              } else {
                                const error = await response.json();
                                toast.error(error.message || 'Mã OTP không chính xác!');
                              }
                            } catch (error) {
                              console.error('Error verifying OTP:', error);
                              toast.error('Có lỗi xảy ra khi xác thực OTP!');
                            }
                          }
                        }}
                        block
                        style={{
                          background: '#2596be',
                          border: 'none',
                          borderRadius: '8px',
                          height: '48px'
                        }}
                      >
                        Xác thực OTP
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

                {/* Step 3: Personal Information - Hiển thị cho cả edit và add */}
                {currentStep === 2 && (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="fullName"
                          label="Họ và tên"
                          rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                        >
                          <Input placeholder="Nhập họ và tên" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="phone"
                          label="Số điện thoại"
                          rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại!' },
                            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                          ]}
                        >
                          <Input placeholder="Nhập số điện thoại" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="dateOfBirth"
                          label="Ngày sinh"
                          rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
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
                          // Lưu dữ liệu step 3 trước khi chuyển
                          const step3Data = form.getFieldsValue(['fullName', 'phone', 'dateOfBirth', 'gender']);
                          console.log('UserManagement: Step 3 data before save:', step3Data);
                          setFormData(prev => ({ ...prev, ...step3Data }));
                          setCurrentStep(3);
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

                      <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => setCurrentStep(selectedUser ? 0 : 1)}
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

                {/* Step 4: Work Information - Hiển thị cho cả edit và add */}
                {currentStep === 3 && (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="role"
                          label="Vai trò"
                          rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                        >
                          <Select placeholder="Chọn vai trò">
                            <Option value="admin">Quản trị viên</Option>
                            <Option value="manager">Quản lý</Option>
                            <Option value="dentist">Nha sĩ</Option>
                            <Option value="nurse">Y tá</Option>
                            <Option value="receptionist">Lễ tân</Option>
                          </Select>
                        </Form.Item>
                      </Col>
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

                    {/* Password Row - Riêng biệt để đảm bảo nằm ngang hàng */}
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="password"
                          label="Mật khẩu"
                          rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                            { max: 16, message: 'Mật khẩu không được quá 16 ký tự!' }
                          ]}
                        >
                          <Input.Password placeholder="Nhập mật khẩu (8-16 ký tự)" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="confirmPassword"
                          label="Xác nhận mật khẩu"
                          dependencies={['password']}
                          rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                              },
                            }),
                          ]}
                        >
                          <Input.Password placeholder="Nhập lại mật khẩu để xác nhận" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col xs={24}>
                        <Form.Item
                          name="description"
                          label="Mô tả"
                        >
                          <Input.TextArea rows={3} placeholder="Nhập mô tả..." />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '24px' }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        style={{
                          background: '#2596be',
                          border: 'none',
                          borderRadius: '8px',
                          height: '48px'
                        }}
                      >
                        {selectedUser ? 'Cập nhật' : 'Thêm mới'}
                      </Button>

                      <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => setCurrentStep(selectedUser ? 0 : 2)}
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

    </div>
  );
};

export default UserManagement;
