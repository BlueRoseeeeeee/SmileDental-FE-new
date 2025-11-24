/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Radio,
  Upload,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Input as AntInput,
  Tabs,
  List,
  Tag,
  Modal,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  SaveOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  IdcardOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { toast } from '../services/toastService';
import TinyMCE from '../components/TinyMCE/TinyMCE';
import { useAuth } from '../contexts/AuthContext';
import { getServiceUrl } from '../config/apiConfig';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = AntInput;

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); // ✅ Get current user
  const currentUserRoles = Array.isArray(currentUser?.roles) && currentUser.roles.length > 0
    ? currentUser.roles
    : (currentUser?.role ? [currentUser.role] : []);
  const isAdmin = currentUserRoles.includes('admin');
  const isManager = currentUserRoles.includes('manager');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [editCertificateModalVisible, setEditCertificateModalVisible] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [newCertificate, setNewCertificate] = useState({ 
    name: '',
    frontImage: null,
    backImage: null,
    frontPreview: null,
    backPreview: null
  });
  const [editCertificate, setEditCertificate] = useState({ 
    name: '',
    frontImage: null,
    backImage: null,
    frontPreview: null,
    backPreview: null
  });
  const [uploading, setUploading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      
      // Check if access token exists
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      
      // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const USER_API = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${USER_API}/user/${id}?_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('API Response:', responseData); // Debug log
        
        // Handle different response structures
        const userData = responseData.data || responseData.user || responseData;
        console.log('User Data:', userData); // Debug log
        
        if (!userData) {
          throw new Error('Không có dữ liệu người dùng trong response');
        }
        
        setUser(userData);
        setCertificates(userData.certificates || []);
        setDescription(userData.description || '');
        
        // Set form values - loại bỏ certificates khỏi form
        const { certificates, description: userDescription, ...formData } = userData;
        try {
          // ✅ Convert role to roles array if needed
          const rolesArray = userData.roles && userData.roles.length > 0 
            ? userData.roles 
            : (userData.role ? [userData.role] : []);
          
          form.setFieldsValue({
            ...formData,
            roles: rolesArray, // ✅ Use roles array
            dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth).format('DD-MM-YYYY') : null
          });
        } catch (formError) {
          console.error('Form Set Fields Error:', formError);
          // Set basic fields if form setting fails
          const rolesArray = userData.roles && userData.roles.length > 0 
            ? userData.roles 
            : (userData.role ? [userData.role] : []);
          
          form.setFieldsValue({
            fullName: userData.fullName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            roles: rolesArray, // ✅ Use roles array
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth) : null
          });
        }
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        toast.error(`Không thể tải thông tin người dùng (${response.status})`);
        navigate('/dashboard/users');
      }
    } catch (error) {
      console.error('Load User Error:', error);
      toast.error(`Lỗi khi tải thông tin người dùng: ${error.message}`);
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      console.log('📤 Form values before processing:', values);
      
      // Loại bỏ certificates và employeeCode khỏi dữ liệu update
      const { certificates, employeeCode, phone, ...updateData } = values;
      
      // ✅ Convert field names to match backend
      if (phone) updateData.phoneNumber = phone; // phone → phoneNumber
      
      updateData.dateOfBirth = values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null;
      updateData.description = description;
      
      console.log('📤 Update data to send:', updateData);

        const USER_API = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${USER_API}/user/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(updateData)
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Update successful:', responseData);
        toast.success('Cập nhật thông tin thành công');
        // ✅ Reload user data để hiển thị thông tin mới
        await loadUser();
      } else {
        const errorData = await response.json();
        console.error('❌ Update User Error:', errorData);
        
        // Ưu tiên hiển thị lỗi từ backend
        if (errorData.message) {
          toast.error(errorData.message);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach(err => {
            toast.error(err.message || err.msg || err);
          });
        } else {
          toast.error(`Cập nhật thông tin thất bại (${response.status})`);
        }
      }
    } catch (error) {
      console.error('❌ Exception in handleSubmit:', error);
      toast.error(`Lỗi khi cập nhật thông tin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      setAvatarLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);

        const USER_API = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${USER_API}/user/avatar/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        const userData = responseData.data || responseData.user;
        setUser(prev => ({ ...prev, avatar: userData.avatar }));
        toast.success('Cập nhật avatar thành công');
        // ✅ Reload user data để force refresh
        await loadUser();
      } else {
        const errorData = await response.json();
        console.error('Avatar Upload Error:', errorData);
        
        // Ưu tiên hiển thị lỗi từ backend
        if (errorData.message) {
          toast.error(errorData.message);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else {
          toast.error(`Cập nhật avatar thất bại (${response.status})`);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAddCertificate = async () => {
    if (!newCertificate.name.trim()) {
      toast.error('Vui lòng nhập tên chứng chỉ');
      return;
    }

    if (!newCertificate.frontImage) {
      toast.error('Vui lòng chọn ít nhất ảnh mặt trước của chứng chỉ');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      // Add action field
      formData.append('action', 'batch-create');
      
      // Add certificate name
      formData.append('name0', newCertificate.name);
      
      // Add front image
      formData.append('frontImages', newCertificate.frontImage);
      
      // Add back image (optional)
      if (newCertificate.backImage) {
        formData.append('backImages', newCertificate.backImage);
      }

      const USER_API = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${USER_API}/user/${id}/certificates`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        setCertificates(responseData.data.certificates);
        setCertificateModalVisible(false);
        setNewCertificate({ 
          name: '',
          frontImage: null,
          backImage: null,
          frontPreview: null,
          backPreview: null
        });
        toast.success('Thêm chứng chỉ thành công');
      } else {
        const errorData = await response.json();
        console.error('Certificate Upload Error:', errorData);
        
        // Ưu tiên hiển thị lỗi từ backend
        if (errorData.message) {
          toast.error(errorData.message);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          // Nếu có nhiều lỗi validation từ backend
          errorData.errors.forEach(err => {
            toast.error(err.message || err.msg || err);
          });
        } else if (errorData.details) {
          // Nếu có chi tiết lỗi
          toast.error(errorData.details);
        } else {
          toast.error(`Thêm chứng chỉ thất bại (${response.status})`);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi thêm chứng chỉ');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    try {
      const formData = new FormData();
      formData.append('action', 'batch-delete');
      formData.append('certificateId0', certificateId);

      const USER_API = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${USER_API}/user/${id}/certificates`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        setCertificates(responseData.data.certificates);
        toast.success('Xóa chứng chỉ thành công');
      } else {
        const errorData = await response.json();
        console.error('Delete Certificate Error:', errorData);
        
        // Ưu tiên hiển thị lỗi từ backend
        if (errorData.message) {
          toast.error(errorData.message);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else {
          toast.error(`Xóa chứng chỉ thất bại (${response.status})`);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi xóa chứng chỉ');
    }
  };

  const handleEditCertificate = (cert) => {
    setEditingCertificate(cert);
    setEditCertificate({
      name: cert.name || '',
      frontImage: null,
      backImage: null,
      frontPreview: null,
      backPreview: null
    });
    setEditCertificateModalVisible(true);
  };

  const handleUpdateCertificate = async (certificateId, updateData) => {
    try {
      const formData = new FormData();
      formData.append('action', 'batch-update');
      formData.append('certificateId0', certificateId);
      
      // Add update fields
      if (updateData.name) {
        formData.append('name0', updateData.name);
      }
      if (updateData.frontImage) {
        formData.append('frontImages', updateData.frontImage);
      }
      if (updateData.backImage) {
        formData.append('backImages', updateData.backImage);
      }

      const USER_API = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${USER_API}/user/${id}/certificates`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        setCertificates(responseData.data.certificates);
        toast.success('Cập nhật chứng chỉ thành công');
        setEditCertificateModalVisible(false);
        setEditingCertificate(null);
        setEditCertificate({ 
          name: '',
          frontImage: null,
          backImage: null,
          frontPreview: null,
          backPreview: null
        });
      } else {
        const errorData = await response.json();
        console.error('Update Certificate Error:', errorData);
        
        // Ưu tiên hiển thị lỗi từ backend
        if (errorData.message) {
          toast.error(errorData.message);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else {
          toast.error(`Cập nhật chứng chỉ thất bại (${response.status})`);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật chứng chỉ');
    }
  };

  const handleFrontImageSelect = (file) => {
    const previewUrl = URL.createObjectURL(file);
    setNewCertificate(prev => ({
      ...prev,
      frontImage: file,
      frontPreview: previewUrl
    }));
    return false; // Prevent default upload
  };

  const handleBackImageSelect = (file) => {
    const previewUrl = URL.createObjectURL(file);
    setNewCertificate(prev => ({
      ...prev,
      backImage: file,
      backPreview: previewUrl
    }));
    return false; // Prevent default upload
  };

  const handleRemoveFrontImage = () => {
    if (newCertificate.frontPreview) {
      URL.revokeObjectURL(newCertificate.frontPreview);
    }
    setNewCertificate(prev => ({
      ...prev,
      frontImage: null,
      frontPreview: null
    }));
  };

  const handleRemoveBackImage = () => {
    if (newCertificate.backPreview) {
      URL.revokeObjectURL(newCertificate.backPreview);
    }
    setNewCertificate(prev => ({
      ...prev,
      backImage: null,
      backPreview: null
    }));
  };

  const handleUpdateName = (name) => {
    setNewCertificate(prev => ({ ...prev, name }));
  };

  // Edit certificate handlers
  const handleEditFrontImageSelect = (file) => {
    const previewUrl = URL.createObjectURL(file);
    setEditCertificate(prev => ({
      ...prev,
      frontImage: file,
      frontPreview: previewUrl
    }));
    return false;
  };

  const handleEditBackImageSelect = (file) => {
    const previewUrl = URL.createObjectURL(file);
    setEditCertificate(prev => ({
      ...prev,
      backImage: file,
      backPreview: previewUrl
    }));
    return false;
  };

  const handleEditRemoveFrontImage = () => {
    if (editCertificate.frontPreview) {
      URL.revokeObjectURL(editCertificate.frontPreview);
    }
    setEditCertificate(prev => ({
      ...prev,
      frontImage: null,
      frontPreview: null
    }));
  };

  const handleEditRemoveBackImage = () => {
    if (editCertificate.backPreview) {
      URL.revokeObjectURL(editCertificate.backPreview);
    }
    setEditCertificate(prev => ({
      ...prev,
      backImage: null,
      backPreview: null
    }));
  };

  const handleEditUpdateName = (name) => {
    setEditCertificate(prev => ({ ...prev, name }));
  };

  const handleEditCertificateModalClose = () => {
    // Clean up object URLs
    if (editCertificate.frontPreview) {
      URL.revokeObjectURL(editCertificate.frontPreview);
    }
    if (editCertificate.backPreview) {
      URL.revokeObjectURL(editCertificate.backPreview);
    }
    setEditCertificateModalVisible(false);
    setEditingCertificate(null);
    setEditCertificate({ 
      name: '',
      frontImage: null,
      backImage: null,
      frontPreview: null,
      backPreview: null
    });
  };

  const handleConfirmEditCertificate = async () => {
    if (!editCertificate.name.trim()) {
      toast.error('Vui lòng nhập tên chứng chỉ');
      return;
    }

    setUploading(true);
    await handleUpdateCertificate(editingCertificate.certificateId, editCertificate);
    setUploading(false);
  };

  const handlePreviewCertificate = (cert) => {
    setPreviewCertificate(cert);
    setPreviewModalVisible(true);
  };

  const handleClosePreview = () => {
    setPreviewModalVisible(false);
    setPreviewCertificate(null);
  };

  const handleCertificateModalClose = () => {
    // Clean up object URLs
    if (newCertificate.frontPreview) {
      URL.revokeObjectURL(newCertificate.frontPreview);
    }
    if (newCertificate.backPreview) {
      URL.revokeObjectURL(newCertificate.backPreview);
    }
    setCertificateModalVisible(false);
    setNewCertificate({ 
      name: '',
      frontImage: null,
      backImage: null,
      frontPreview: null,
      backPreview: null
    });
  };

  if (loading && !user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      width: '100%',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text type="secondary">
              Cập nhật thông tin cá nhân, avatar và chứng chỉ
            </Text>
          </div>
          <Button 
            onClick={() => navigate('/dashboard/users')}
            style={{ borderRadius: '8px' }}
          >
            Quay lại
          </Button>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Main Content - Tabs */}
        <Col xs={24}>
          <Card>
            <Tabs
              defaultActiveKey="info"
              items={[
                {
                  key: 'info',
                  label: 'Chỉnh sửa thông tin',
                  children: (
                    <Row gutter={[24, 24]}>
                      {/* Left Column - Avatar */}
                      <Col xs={24} lg={8}>
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <div style={{ 
                            width: '150px', 
                            height: '150px', 
                            borderRadius: '50%',
                            overflow: 'hidden',
                            margin: '0 auto 16px',
                            border: '3px solid #2596be',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f0f0f0'
                          }}>
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt="Avatar" 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover' 
                                }}
                              />
                            ) : (
                              <UserOutlined style={{ fontSize: '48px', color: '#999' }} />
                            )}
                          </div>
                          
                          <Upload
                            beforeUpload={(file) => {
                              handleAvatarUpload(file);
                              return false;
                            }}
                            showUploadList={false}
                            accept="image/*"
                          >
                            <Button 
                              type="primary" 
                              icon={<UploadOutlined />}
                              loading={avatarLoading}
                              style={{ borderRadius: '8px' }}
                            >
                              {avatarLoading ? 'Đang tải...' : 'Thay đổi avatar'}
                            </Button>
                          </Upload>
                        </div>
                      </Col>

                      {/* Right Column - Form */}
                      <Col xs={24} lg={16}>
                        <Form
                          form={form}
                          layout="vertical"
                          onFinish={handleSubmit}
                        >
                      <Title level={4}>Thông tin cá nhân</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="employeeCode"
                            label="Mã nhân viên"
                          >
                            <Input 
                              prefix={<IdcardOutlined />}
                              placeholder="Mã nhân viên"
                              style={{ borderRadius: '8px' }}
                              disabled
                            />
                          </Form.Item>
                        </Col>
                        
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="fullName"
                            label="Họ và tên"
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                          >
                            <Input 
                              prefix={<UserOutlined />}
                              placeholder="Nhập họ và tên"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>
                        
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                              { required: true, message: 'Vui lòng nhập email!' },
                              { type: 'email', message: 'Email không hợp lệ!' }
                            ]}
                          >
                            <Input 
                              prefix={<MailOutlined />}
                              placeholder="Nhập email"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="phone"
                            label="Số điện thoại"
                            rules={[
                              { required: true, message: 'Vui lòng nhập số điện thoại!' },
                              { pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ!' }
                            ]}
                          >
                            <Input 
                              prefix={<PhoneOutlined />}
                              placeholder="Nhập số điện thoại"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="dateOfBirth"
                            label="Ngày sinh"
                            rules={[
                              { required: true, message: 'Vui lòng chọn ngày sinh!' },
                              {
                                validator: (_, value) => {
                                  if (!value) return Promise.resolve();
                                  
                                  const today = new Date();
                                  const birthDate = new Date(value);
                                  let age = today.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = today.getMonth() - birthDate.getMonth();
                                  
                                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                  }
                                  
                                  if (age < 18) {
                                    return Promise.reject(new Error('Nhân viên phải từ 18 tuổi trở lên!'));
                                  }
                                  
                                  if (birthDate > today) {
                                    return Promise.reject(new Error('Ngày sinh không được ở tương lai!'));
                                  }
                                  
                                  return Promise.resolve();
                                }
                              }
                            ]}
                          >
                            <DatePicker 
                              style={{ width: '100%', borderRadius: '8px' }}
                              placeholder="Chọn ngày sinh"
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
                              <Radio value="male">Nam</Radio>
                              <Radio value="female">Nữ</Radio>
                            </Radio.Group>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider />

                      <Title level={4}>Thông tin công việc</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="roles"
                            label="Vai trò"
                            rules={[
                              { required: true, message: 'Vui lòng chọn ít nhất một vai trò!' },
                              { type: 'array', min: 1, message: 'Phải có ít nhất một vai trò!' }
                            ]}
                          >
                            <Select 
                              mode="multiple"
                              placeholder="Chọn vai trò (có thể chọn nhiều)" 
                              style={{ borderRadius: '8px' }}
                              maxTagCount="responsive"
                            >
                              {/* ✅ Role hierarchy based on current user's permission */}
                              {isAdmin ? (
                                <>
                                  {/* Admin can assign: manager, dentist, nurse, receptionist (NOT admin) */}
                                  <Option value="manager">Quản lý</Option>
                                  <Option value="dentist">Nha sĩ</Option>
                                  <Option value="nurse">Y tá</Option>
                                  <Option value="receptionist">Lễ tân</Option>
                                </>
                              ) : isManager ? (
                                <>
                                  {/* Manager can assign: dentist, nurse, receptionist (NOT admin, manager) */}
                                  <Option value="dentist">Nha sĩ</Option>
                                  <Option value="nurse">Y tá</Option>
                                  <Option value="receptionist">Lễ tân</Option>
                                </>
                              ) : (
                                <>
                                  {/* Fallback: should not happen */}
                                  <Option value="dentist">Nha sĩ</Option>
                                  <Option value="nurse">Y tá</Option>
                                  <Option value="receptionist">Lễ tân</Option>
                                </>
                              )}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="isActive"
                            label="Trạng thái"
                            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                          >
                            <Radio.Group>
                              <Radio value={true}>Hoạt động</Radio>
                              <Radio value={false}>Không hoạt động</Radio>
                            </Radio.Group>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider />

                      <Title level={4}>Thông tin bổ sung</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <Form.Item
                            name="description"
                            label="Mô tả"
                          >
                            <div style={{
                              height: '400px'
                            }}>
                              <TinyMCE
                                value={description}
                                onChange={setDescription}
                                placeholder="Nhập mô tả về kinh nghiệm, thành tích hoặc thông tin bổ sung..."
                                containerStyle={{ width: '100%'}}
                              />
                            </div>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider />

                      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button 
                          onClick={() => navigate('/dashboard/users')}
                          style={{ borderRadius: '8px' }}
                        >
                          Hủy
                        </Button>
                        <Button 
                          type="primary" 
                          htmlType="submit"
                          loading={loading}
                          icon={<SaveOutlined />}
                          style={{ 
                            background: '#2596be',
                            border: 'none',
                            borderRadius: '8px'
                          }}
                        >
                          Lưu thay đổi
                        </Button>
                      </Space>
                    </Form>
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'certificates',
                  label: `Chứng chỉ & Bằng cấp ${certificates && certificates.length > 0 ? `(${certificates.length})` : ''}`,
                  children: (
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <Title level={4} style={{ margin: 0 }}>Chứng chỉ & Bằng cấp</Title>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => setCertificateModalVisible(true)}
                          style={{ borderRadius: '8px' }}
                        >
                          Thêm chứng chỉ
                        </Button>
                      </div>

                      {certificates.length === 0 ? (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#999', 
                          padding: '40px 20px',
                          background: '#fafafa',
                          borderRadius: '8px',
                          border: '1px dashed #d9d9d9'
                        }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
                          <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                            Chưa có chứng chỉ nào
                          </div>
                          <div style={{ fontSize: '14px', color: '#ccc' }}>
                            Nhấn "Thêm chứng chỉ" để upload ảnh
                          </div>
                        </div>
                      ) : (
                        <List
                          dataSource={certificates}
                          renderItem={(cert, index) => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="link" 
                                  icon={<EyeOutlined />}
                                  onClick={() => handlePreviewCertificate(cert)}
                                >
                                  Xem
                                </Button>,
                                <Button 
                                  type="link" 
                                  icon={<EditOutlined />}
                                  onClick={() => handleEditCertificate(cert)}
                                >
                                  Chỉnh sửa
                                </Button>,
                                <Popconfirm
                                  title="Xóa chứng chỉ"
                                  description="Bạn có chắc chắn muốn xóa chứng chỉ này không?"
                                  onConfirm={() => handleDeleteCertificate(cert.certificateId)}
                                  okText="Có, xóa"
                                  cancelText="Hủy"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button 
                                    type="link" 
                                    danger
                                    icon={<DeleteOutlined />}
                                  >
                                    Xóa
                                  </Button>
                                </Popconfirm>
                              ]}
                            >
                              <List.Item.Meta
                                title={cert.name || `Chứng chỉ ${index + 1}`}
                                description={
                                  <div>
                                    <div style={{ marginBottom: '8px' }}>
                                      {cert.notes && <div>Ghi chú: {cert.notes}</div>}
                                      <div style={{ fontSize: '12px', color: '#999' }}>
                                        {cert.uploadedAt 
                                          ? `Upload: ${new Date(cert.uploadedAt).toLocaleDateString('vi-VN')}`
                                          : `Tạo: ${new Date(cert.createdAt).toLocaleDateString('vi-VN')}`
                                        }
                                      </div>
                                    </div>
                                    <Tag color={cert.isVerified ? 'green' : 'orange'}>
                                      {cert.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                    </Tag>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Certificate Modal */}
      <Modal
        title="Thêm chứng chỉ mới"
        open={certificateModalVisible}
        onOk={handleAddCertificate}
        onCancel={handleCertificateModalClose}
        okText={uploading ? "Đang tải lên..." : "Thêm chứng chỉ"}
        cancelText="Hủy"
        width={800}
        okButtonProps={{ 
          disabled: !newCertificate.name.trim() || !newCertificate.frontImage || uploading,
          loading: uploading 
        }}
      >
        {/* Certificate Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
            Tên chứng chỉ: <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <Input
            value={newCertificate.name}
            onChange={(e) => handleUpdateName(e.target.value)}
            placeholder="Nhập tên chứng chỉ..."
            style={{ borderRadius: '8px' }}
            status={!newCertificate.name.trim() ? 'error' : ''}
          />
          {!newCertificate.name.trim() && (
            <div style={{ 
              color: '#ff4d4f', 
              fontSize: '12px', 
              marginTop: '4px' 
            }}>
              Tên chứng chỉ không được để trống
            </div>
          )}
        </div>

        {/* Front Image Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
            Ảnh mặt trước chứng chỉ: <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <Upload
            beforeUpload={handleFrontImageSelect}
            showUploadList={false}
            accept="image/*"
          >
            <Button 
              icon={<UploadOutlined />} 
              style={{ 
                width: '100%', 
                height: '50px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              📁 Chọn ảnh mặt trước
            </Button>
          </Upload>
          {!newCertificate.frontImage && (
            <div style={{ 
              color: '#ff4d4f', 
              fontSize: '12px', 
              marginTop: '4px' 
            }}>
              Vui lòng chọn ảnh mặt trước của chứng chỉ
            </div>
          )}
        </div>

        {/* Back Image Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
            Ảnh mặt sau chứng chỉ (nếu có):
          </label>
          <Upload
            beforeUpload={handleBackImageSelect}
            showUploadList={false}
            accept="image/*"
          >
            <Button 
              icon={<UploadOutlined />} 
              style={{ 
                width: '100%', 
                height: '50px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              📁 Chọn ảnh mặt sau 
            </Button>
          </Upload>
        </div>

        {/* Image Previews */}
        {(newCertificate.frontImage || newCertificate.backImage) && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '12px',
              color: '#333'
            }}>
              📋 Ảnh đã chọn:
            </div>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              {/* Front Image Preview */}
              {newCertificate.frontImage && (
                <div style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '4px'
                      }}>
                        📄 Mặt trước: {newCertificate.frontImage.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666' 
                      }}>
                        Kích thước: {(newCertificate.frontImage.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveFrontImage}
                      style={{ marginLeft: '8px' }}
                    >
                      Xóa
                    </Button>
                  </div>

                  {/* Front Image Preview */}
                  <div style={{ marginBottom: '12px' }}>
                    <img 
                      src={newCertificate.frontPreview} 
                      alt="Front Preview"
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Back Image Preview */}
              {newCertificate.backImage && (
                <div style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '4px'
                      }}>
                        📄 Mặt sau: {newCertificate.backImage.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666' 
                      }}>
                        Kích thước: {(newCertificate.backImage.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveBackImage}
                      style={{ marginLeft: '8px' }}
                    >
                      Xóa
                    </Button>
                  </div>

                  {/* Back Image Preview */}
                  <div style={{ marginBottom: '12px' }}>
                    <img 
                      src={newCertificate.backPreview} 
                      alt="Back Preview"
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </Modal>

      {/* Edit Certificate Modal */}
      <Modal
        title="Chỉnh sửa chứng chỉ"
        open={editCertificateModalVisible}
        onOk={handleConfirmEditCertificate}
        onCancel={handleEditCertificateModalClose}
        okText={uploading ? "Đang cập nhật..." : "Cập nhật chứng chỉ"}
        cancelText="Hủy"
        width={800}
        okButtonProps={{ 
          disabled: !editCertificate.name.trim() || uploading,
          loading: uploading 
        }}
      >
        {/* Certificate Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
            Tên chứng chỉ: <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <Input
            value={editCertificate.name}
            onChange={(e) => handleEditUpdateName(e.target.value)}
            placeholder="Nhập tên chứng chỉ..."
            style={{ borderRadius: '8px' }}
            status={!editCertificate.name.trim() ? 'error' : ''}
          />
          {!editCertificate.name.trim() && (
            <div style={{ 
              color: '#ff4d4f', 
              fontSize: '12px', 
              marginTop: '4px' 
            }}>
              Tên chứng chỉ không được để trống
            </div>
          )}
        </div>

        {/* Current Images Display */}
        {editingCertificate && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
              Ảnh hiện tại:
            </label>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              {editingCertificate.frontImage && (
                <div style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fafafa'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#333',
                    marginBottom: '8px'
                  }}>
                     Mặt trước hiện tại:
                  </div>
                  <img 
                    src={editingCertificate.frontImage} 
                    alt="Current Front"
                    style={{ 
                      width: '100%', 
                      maxHeight: '150px', 
                      objectFit: 'contain',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      background: 'white'
                    }}
                  />
                </div>
              )}
              {editingCertificate.backImage && (
                <div style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fafafa'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#333',
                    marginBottom: '8px'
                  }}>
                    Mặt sau hiện tại:
                  </div>
                  <img 
                    src={editingCertificate.backImage} 
                    alt="Current Back"
                    style={{ 
                      width: '100%', 
                      maxHeight: '150px', 
                      objectFit: 'contain',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      background: 'white'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Front Image Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
            Ảnh mặt trước mới (để trống nếu không thay đổi):
          </label>
          <Upload
            beforeUpload={handleEditFrontImageSelect}
            showUploadList={false}
            accept="image/*"
          >
            <Button 
              icon={<UploadOutlined />} 
              style={{ 
                width: '100%', 
                height: '50px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              📁 Chọn ảnh mặt trước mới
            </Button>
          </Upload>
        </div>

        {/* Back Image Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
            Ảnh mặt sau mới (để trống nếu không thay đổi):
          </label>
          <Upload
            beforeUpload={handleEditBackImageSelect}
            showUploadList={false}
            accept="image/*"
          >
            <Button 
              icon={<UploadOutlined />} 
              style={{ 
                width: '100%', 
                height: '50px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              📁 Chọn ảnh mặt sau mới
            </Button>
          </Upload>
        </div>

        {/* New Image Previews */}
        {(editCertificate.frontImage || editCertificate.backImage) && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '12px',
              color: '#333'
            }}>
              📋 Ảnh mới đã chọn:
            </div>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              {/* Front Image Preview */}
              {editCertificate.frontImage && (
                <div style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '4px'
                      }}>
                         Mặt trước mới: {editCertificate.frontImage.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666' 
                      }}>
                        Kích thước: {(editCertificate.frontImage.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleEditRemoveFrontImage}
                      style={{ marginLeft: '8px' }}
                    >
                      Xóa
                    </Button>
                  </div>

                  {/* Front Image Preview */}
                  <div style={{ marginBottom: '12px' }}>
                    <img 
                      src={editCertificate.frontPreview} 
                      alt="New Front Preview"
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Back Image Preview */}
              {editCertificate.backImage && (
                <div style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '4px'
                      }}>
                         Mặt sau mới: {editCertificate.backImage.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666' 
                      }}>
                        Kích thước: {(editCertificate.backImage.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleEditRemoveBackImage}
                      style={{ marginLeft: '8px' }}
                    >
                      Xóa
                    </Button>
                  </div>

                  {/* Back Image Preview */}
                  <div style={{ marginBottom: '12px' }}>
                    <img 
                      src={editCertificate.backPreview} 
                      alt="New Back Preview"
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Certificate Preview Modal */}
      <Modal
        title={previewCertificate ? `${previewCertificate.name || 'Chứng chỉ'}` : ''}
        open={previewModalVisible}
        onCancel={handleClosePreview}
        footer={null}
        width="auto"
        style={{ maxWidth: '90vw' }}
        centered
      >
        {previewCertificate && (
          <div>
            {(previewCertificate.frontImage || previewCertificate.backImage) && (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: previewCertificate.backImage ? '1fr 1fr' : '1fr',
                gap: '20px',
                alignItems: 'start'
              }}>
                {/* Front Image */}
                {previewCertificate.frontImage && (
                  <div>
                    {/* Chỉ hiển thị label nếu có cả 2 ảnh */}
                    {previewCertificate.backImage && (
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '500', 
                        marginBottom: '12px',
                        color: '#333',
                        textAlign: 'center'
                      }}>
                         Mặt trước
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={previewCertificate.frontImage} 
                        alt="Mặt trước"
                        style={{ 
                          width: '100%', 
                          maxHeight: '80vh', 
                          height: '80vh',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Back Image */}
                {previewCertificate.backImage && (
                  <div>
                    {/* Chỉ hiển thị label nếu có cả 2 ảnh */}
                    {previewCertificate.frontImage && (
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '500', 
                        marginBottom: '12px',
                        color: '#333',
                        textAlign: 'center'
                      }}>
                         Mặt sau
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={previewCertificate.backImage} 
                        alt="Mặt sau"
                        style={{ 
                          width: '100%', 
                          height: '80vh',
                          maxHeight: '80vh', 
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Old format single image */}
            {previewCertificate.imageUrl && !previewCertificate.frontImage && (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={previewCertificate.imageUrl} 
                  alt="Chứng chỉ"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '80vh', 
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #d9d9d9'
                  }}
                />
              </div>
            )}

            {/* No images message */}
            {!previewCertificate.frontImage && !previewCertificate.backImage && !previewCertificate.imageUrl && (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '40px 20px',
                fontSize: '16px'
              }}>
                Không có ảnh để hiển thị
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default EditUser;
