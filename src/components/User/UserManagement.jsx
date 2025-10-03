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
  Popconfirm,
  Avatar,
  Row,
  Col,
  Tooltip,
  Steps,
  Radio,
  Alert,
  DatePicker
} from 'antd';
import { 
  CheckCircleOutlined,
  ArrowLeftOutlined
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
import SearchBar from '../Common/SearchBar.jsx';
import { 
  searchAndFilter, 
  createRoleFilter, 
  createStatusFilter,
  debounce 
} from '../../utils/searchUtils.js';
import { 
  handleFullNameFormat,
  getAntDesignFormRules
} from '../../utils/validationUtils.js';
import dayjs from 'dayjs';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [formData, setFormData] = useState({}); // Lưu dữ liệu từ các steps

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
  }, [pagination.current, pagination.pageSize]);

  // Debounced search effect
  useEffect(() => {
    const debouncedSearch = debounce(() => {
      applySearchAndFilter();
    }, 300);
    
    debouncedSearch();
  }, [searchTerm, filters, users]);

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
    } catch {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const applySearchAndFilter = () => {
    const searchFields = ['fullName', 'email', 'phone', 'employeeCode'];
    const filtered = searchAndFilter(users, searchTerm, searchFields, filters);
    setFilteredUsers(filtered);
    
    // Update pagination total
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      current: 1 // Reset to first page when filtering
    }));
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (user) => {
    // Navigate to edit page instead of opening modal
    navigate(`/users/edit/${user._id}`);
  };

  const handleView = (user) => {
    // Navigate to detail page instead of opening modal
    navigate(`/users/detail/${user._id}`);
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
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
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
        // Add new user - requires OTP verification
        const step4Data = form.getFieldsValue();
        // Combine data from all steps
        const registerData = {
          ...formData, // Dữ liệu từ step 3 đã lưu
          ...step4Data, // Dữ liệu từ step 4
          email: email, // Email từ step 1
          role: step4Data.role || 'patient',
          dateOfBirth: step4Data.dateOfBirth ? step4Data.dateOfBirth.format('YYYY-MM-DD') : formData.dateOfBirth ? formData.dateOfBirth.format('YYYY-MM-DD') : null
        };
        

        
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
      <Tag color="green" style={{ fontSize: '16px' }}>Đang làm việc</Tag>
    ) : (
      <Tag color="red" style={{ fontSize: '16px' }}>Đã nghỉ việc</Tag>
    );
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
      title: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
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
          <Tooltip title={record.isActive ? 'Nhân viên nghỉ việc (Khóa tài khoản)' : 'Mở khóa tài khoản'}>
            <Switch
              size="small"
              checked={record.isActive}
              onChange={() => handleToggleStatus(record)}
              checkedChildren="Mở"
              unCheckedChildren="Khóa"
            />
          </Tooltip>
          <Tooltip title="Xóa nhân viên">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
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
      <SearchBar
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        placeholder="       Tìm kiếm theo tên, email, số điện thoại, mã nhân viên..."
        filters={[
          createRoleFilter(),
          createStatusFilter()
        ]}
        searchValue={searchTerm}
        filterValues={filters}
        loading={loading}
        cardStyle={{
          marginBottom: '24px'
        }}
      />

      {/* Action Buttons */}
      <div style={{ marginBottom: '24px', textAlign: 'right' }}>
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
      </div>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
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

                  {
                    title: 'Thông tin cá nhân',
                    description: 'Nhập thông tin cơ bản',
                  },
                  {
                    title: 'Thông tin công việc',
                    description: 'Vai trò, Loại công việc, Trạng thái',
                  }
                ] : [

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
                {!selectedUser && currentStep === 0 && (
                  <div>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={getAntDesignFormRules.email()}
                    >
                      <Input placeholder="Nhập email của nhân viên" />
                    </Form.Item>

                    <Button
                      type="primary"
                      onClick={async () => {
                        const emailValue = form.getFieldValue('email');
                        if (emailValue) {
                          try {

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

                              setEmail(emailValue);
                              setOtpMessage(data.message || 'OTP đã được gửi đến email!');
                              setOtpSent(true);
                              setCurrentStep(1);
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
                {!selectedUser && currentStep === 1 && (
                  <div>
                    <Form.Item
                      name="otp"
                      label="Mã OTP"
                      rules={getAntDesignFormRules.otp()}
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

                {/* Step 3: Personal Information */}
                {currentStep === 2 && (
                  <div>
                    <Row gutter={[16, 16]}>
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
                          name="phone"
                          label="Số điện thoại"
                          rules={getAntDesignFormRules.phone()}
                        >
                          <Input placeholder="Nhập số điện thoại" />
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
                          // Save step 3 data before proceeding
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

                {/* Step 4: Work Information */}
                {currentStep === 3 && (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="role"
                          label="Vai trò"
                          rules={getAntDesignFormRules.role()}
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

                    {/* Password Fields */}
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="password"
                          label="Mật khẩu"
                          rules={getAntDesignFormRules.password()}
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
                            ...getAntDesignFormRules.confirmPassword(),
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

      {/* Toggle Status Modal */}
      <Modal
        title={`${selectedUserForToggle?.isActive ? 'Khóa tài khoản nhân viên' : 'Mở khóa tài khoản nhân viên'}`}
        visible={showToggleModal}
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
        visible={showDeleteModal}
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
