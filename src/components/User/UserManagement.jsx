/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
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
  Tabs
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
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [formData, setFormData] = useState({}); // Lưu dữ liệu từ các steps

  // Helper function để tạo info item dạng list
  const createInfoItem = (label, value, copyable = false, icon = null) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid #f0f0f0'
    }}
    >
      <div style={{
        minWidth: '160px',
        fontSize: '15px',
        color: '#666',
        fontWeight: '500'
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        fontSize: '16px',
        color: '#333',
        fontWeight: '400'
      }}>
        {copyable ? (
          <Text copyable={{ text: value }} style={{ fontSize: '16px' }}>
            {value}
          </Text>
        ) : value}
      </div>
      {icon && (
        <div style={{ marginLeft: '12px', color: '#2596be' }}>
          {icon}
        </div>
      )}
    </div>
  );

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
    setSelectedUser(user);
    form.setFieldsValue({
      ...user,
      dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null
    });
    setModalVisible(true);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setViewModalVisible(true);
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
      const updateData = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
      };
      
      if (selectedUser) {
        // Cập nhật user hiện có
        await userService.updateUserByAdmin(selectedUser._id, updateData);
        toast.success('Cập nhật thông tin thành công');
      } else {
        // Lấy dữ liệu từ step 4 hiện tại
        const step4Data = form.getFieldsValue();
        
        // Kết hợp dữ liệu từ tất cả các steps
        const registerData = {
          ...formData, // Dữ liệu từ step 3 đã lưu
          ...step4Data, // Dữ liệu từ step 4
          email: email, // Email từ step 1
          role: step4Data.role || 'patient'
        };
        
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
      title: 'Avatar',
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

  const getStats = () => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const inactive = total - active;
    
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    return { total, active, inactive, roleStats };
  };

  const stats = getStats();

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
          Quản lý người dùng
        </Title>
        <Text type="secondary">
          Quản lý thông tin nhân viên và bệnh nhân trong hệ thống
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Tổng số" 
              value={stats.total} 
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Hoạt động" 
              value={stats.active} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Không hoạt động" 
              value={stats.inactive} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Nha sĩ" 
              value={stats.roleStats.dentist || 0} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Search
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              onSearch={handleSearch}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="Vai trò"
              style={{ width: '100%' }}
              value={filters.role}
              onChange={(value) => handleFilterChange('role', value)}
              allowClear
            >
              <Option value="admin">Quản trị viên</Option>
              <Option value="manager">Quản lý</Option>
              <Option value="dentist">Nha sĩ</Option>
              <Option value="nurse">Y tá</Option>
              <Option value="receptionist">Lễ tân</Option>
              <Option value="patient">Bệnh nhân</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="Trạng thái"
              style={{ width: '100%' }}
              value={filters.isActive}
              onChange={(value) => handleFilterChange('isActive', value)}
              allowClear
            >
              <Option value="true">Hoạt động</Option>
              <Option value="false">Không hoạt động</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadUsers}
                loading={loading}
              >
                Làm mới
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedUser(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                Thêm mới
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
        title={selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
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
                items={[
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
                {/* Step 1: Email Verification */}
                {currentStep === 0 && (
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

                {/* Step 2: OTP Verification */}
                {currentStep === 1 && (
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
                              const response = await fetch('http://localhost:3001/api/auth/verify-otp', {
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

                {/* Step 3: Personal Information */}
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
                          <Input type="date" />
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
                        onClick={() => setCurrentStep(1)}
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

                {/* Step 4: Work Information */}
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
                            <Option value="patient">Bệnh nhân</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="type"
                          label="Loại công việc"
                          initialValue="fullTime"
                        >
                          <Select placeholder="Chọn loại công việc">
                            <Option value="fullTime">Toàn thời gian</Option>
                            <Option value="partTime">Bán thời gian</Option>
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
                        onClick={() => setCurrentStep(2)}
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

      {/* View Modal - Redesigned */}
      <Modal
        title={null}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
        transitionName=""
        maskTransitionName=""
        closeIcon={
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#666',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            borderRadius: '50%',
            border: '2px solid #ddd',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#ff4d4f';
            e.target.style.color = 'white';
            e.target.style.borderColor = '#ff4d4f';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#f5f5f5';
            e.target.style.color = '#666';
            e.target.style.borderColor = '#ddd';
          }}
          >
            ×
          </div>
        }
      >
        {selectedUser && (
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Header với gradient */}
            <div style={{ 
              padding: '32px 32px 24px 32px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Avatar 
                size={100} 
                src={selectedUser.avatar} 
                icon={<UserOutlined />}
                style={{ 
                  border: '4px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}
              />
              <div style={{ marginTop: '20px' }}>
                <Title level={3} style={{ 
                  color: 'white', 
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {selectedUser.fullName}
                </Title>
                <div style={{ marginTop: '8px' }}>
                  {getRoleTag(selectedUser.role)}
                </div>
              </div>
            </div>

            {/* Content với layout linh hoạt */}
            <div style={{ 
              padding: '32px',
              background: 'white'
            }}>
              {/* Tabs để dễ mở rộng */}
              <Tabs 
                defaultActiveKey="basic" 
                items={[
                  {
                    key: 'basic',
                    label: 'Thông tin cơ bản',
                    children: (
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8',
                        overflow: 'hidden'
                      }}>
                        {selectedUser.employeeCode && 
                          createInfoItem('Mã nhân viên', <Text code>{selectedUser.employeeCode}</Text>)
                        }
                        {createInfoItem('Email', selectedUser.email, true)}
                        {createInfoItem('Số điện thoại', selectedUser.phone, true)}
                        {createInfoItem('Ngày sinh', dayjs(selectedUser.dateOfBirth).format('DD/MM/YYYY'))}
                        {createInfoItem('Giới tính', selectedUser.gender === 'male' ? 'Nam' : selectedUser.gender === 'female' ? 'Nữ' : 'Khác')}
                        {createInfoItem('Trạng thái', getStatusTag(selectedUser.isActive))}
                        
                      </div>
                    )
                  },
                  {
                    key: 'work',
                    label: 'Thông tin công việc',
                    children: (
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8',
                        overflow: 'hidden'
                      }}>
                        {createInfoItem('Vai trò', getRoleTag(selectedUser.role))}
                        {createInfoItem('Loại công việc', selectedUser.type === 'fullTime' ? 'Toàn thời gian' : 'Bán thời gian')}
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '16px 20px',
                          borderBottom: 'none'
                        }}>
                          <div style={{
                            minWidth: '160px',
                            fontSize: '15px',
                            color: '#666',
                            fontWeight: '500'
                          }}>
                            Mô tả
                          </div>
                          <div style={{
                            flex: 1,
                            fontSize: '16px',
                            color: '#333',
                            fontWeight: '400',
                            lineHeight: '1.5'
                          }}>
                            {selectedUser.description || 'Không có mô tả'}
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'certificates',
                    label: 'Chứng chỉ & Bằng cấp',
                    children: (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                      </div>
                    )
                  }
                ]}
                style={{ marginTop: '16px' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
