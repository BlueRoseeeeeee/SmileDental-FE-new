/*
* @author: HoTram
* @updated: SmileCare Design System Polish
*/
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  InputNumber,
  Switch,
  Modal,
  Tooltip,
  Input,
  Select,
} from 'antd';
import { toast } from '../services/toastService';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import roomService from '../services/roomService';
import { searchAndFilter, debounce } from '../utils/searchUtils';
import smileCareTheme from '../theme/smileCareTheme';
import './RoomManagement.css';

const { Title, Text } = Typography;

const RoomManagement = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [subRooms, setSubRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addSubRoomCount, setAddSubRoomCount] = useState(1);
  const [isAddingSubRooms, setIsAddingSubRooms] = useState(false);
  const [toggleLoadingMap, setToggleLoadingMap] = useState({});

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isActive: null,
    hasBeenUsed: null
  });
  const [filteredSubRooms, setFilteredSubRooms] = useState([]);

  // Toggle confirmation modal states
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedSubRoom, setSelectedSubRoom] = useState(null);

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubRoomForDelete, setSelectedSubRoomForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  // Effect để filter dữ liệu khi searchTerm hoặc filters thay đổi
  useEffect(() => {
    const searchFields = ['name'];
    const filtered = searchAndFilter(subRooms, searchTerm, searchFields, filters);
    setFilteredSubRooms(filtered);
  }, [subRooms, searchTerm, filters]);

  const fetchRoomDetails = async () => {
    setLoading(true);
    try {
      const response = await roomService.getRoomById(roomId);
      console.log('API Response:', response); // Debug log
      
      // API trả về {room: {...}} nên cần lấy response.room
      const roomData = response.room || response;
      setRoom(roomData);
      setSubRooms(roomData.subRooms || []);
    } catch (error) {
      toast.error('Lỗi khi tải thông tin phòng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubRooms = async () => {
    if (addSubRoomCount < 1) {
      toast.warning('Số lượng buồng phải lớn hơn 0');
      return;
    }

    setIsAddingSubRooms(true);
    try {
      const response = await roomService.addSubRooms(roomId, addSubRoomCount);
      setSubRooms(response.room.subRooms);
      toast.success(`Đã thêm ${addSubRoomCount} buồng thành công`);
      setAddSubRoomCount(1);
    } catch (error) {
      toast.error('Lỗi khi thêm buồng: ' + error.message);
    } finally {
      setIsAddingSubRooms(false);
    }
  };

  // Handle show toggle confirmation modal
  const handleToggleSubRoomStatus = (subRoom) => {
    setSelectedSubRoom(subRoom);
    setShowToggleModal(true);
  };

  // Handle confirm toggle subroom status
  const handleConfirmToggle = async () => {
    if (!selectedSubRoom) return;
    
    try {
      // Set loading cho button cụ thể
      setToggleLoadingMap(prev => ({ ...prev, [selectedSubRoom._id]: true }));
      
      const updatedRoom = await roomService.toggleSubRoomStatus(room._id, selectedSubRoom._id);
      
      // Update local state với dữ liệu mới từ server
      setRoom(updatedRoom);
      setSubRooms(updatedRoom.subRooms || []);
      
      const newStatus = selectedSubRoom.isActive ? 'tắt' : 'kích hoạt';
      toast.success(`Đã ${newStatus} buồng "${selectedSubRoom.name}" thành công!`);
      
    } catch (error) {
      toast.error('Lỗi khi thay đổi trạng thái buồng: ' + (error.response?.data?.message || error.message));
    } finally {
      // Clear loading cho button cụ thể
      setToggleLoadingMap(prev => ({ ...prev, [selectedSubRoom._id]: false }));
      setShowToggleModal(false);
      setSelectedSubRoom(null);
    }
  };

  // Handle cancel toggle confirmation
  const handleCancelToggle = () => {
    setShowToggleModal(false);
    setSelectedSubRoom(null);
  };

  // Handle show delete confirmation modal
  const handleDeleteSubRoom = (subRoom) => {
    setSelectedSubRoomForDelete(subRoom);
    setShowDeleteModal(true);
  };

  // Handle confirm delete subroom
  const handleConfirmDelete = async () => {
    if (!selectedSubRoomForDelete) return;
    
    try {
      setDeleteLoading(true);
      const response = await roomService.deleteSubRoom(room._id, selectedSubRoomForDelete._id);
      
      // Update local state với room data mới từ server
      if (response.room) {
        setRoom(response.room);
        setSubRooms(response.room.subRooms || []);
      }
      
      toast.success(`Đã xóa buồng "${selectedSubRoomForDelete.name}" thành công!`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Lỗi khi xóa buồng: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedSubRoomForDelete(null);
    }
  };

  // Handle cancel delete confirmation
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedSubRoomForDelete(null);
  };

  // Filter handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };


  const columns = [
    {
      title: <Text strong style={{ fontSize: 13 }}>STT</Text>,
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: smileCareTheme.colors.primary[50],
          color: smileCareTheme.colors.primary[600],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 13
        }}>
          {index + 1}
        </div>
      ),
      width: 80,
      align: 'center'
    },
    {
      title: <Text strong style={{ fontSize: 13 }}>Tên buồng khám</Text>,
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space size="middle">
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: record.isActive ? '#dbeafe' : '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HomeOutlined style={{ 
              fontSize: 18, 
              color: record.isActive ? smileCareTheme.colors.primary[600] : smileCareTheme.colors.error[600]
            }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14, display: 'block' }}>{text}</Text>
            {record.hasBeenUsed && (
              <Tag 
                color="orange" 
                style={{ 
                  marginTop: 4,
                  borderRadius: 6,
                  fontSize: 11,
                  padding: '2px 8px'
                }}
              >
                Đã sử dụng
              </Tag>
            )}
          </div>
        </Space>
      )
    },
    {
      title: <Text strong style={{ fontSize: 13 }}>Trạng thái</Text>,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 180,
      render: (isActive) => (
        <Tag 
          color={isActive ? 'success' : 'error'} 
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none'
          }}
        >
          {isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
        </Tag>
      ),
      align: 'center'
    },
    {
      title: <Text strong style={{ fontSize: 13 }}>Thao tác</Text>,
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={record.isActive ? 'Tắt buồng' : 'Bật buồng'}>
            <Switch
              checked={record.isActive}
              loading={toggleLoadingMap[record._id]}
              onChange={() => handleToggleSubRoomStatus(record)}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              style={{
                background: record.isActive ? smileCareTheme.colors.success[500] : undefined
              }}
            />
          </Tooltip>
          
          <Tooltip title={record.hasBeenUsed ? 'Không thể xóa buồng đã sử dụng' : 'Xóa buồng'}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={record.hasBeenUsed}
              onClick={() => handleDeleteSubRoom(record)}
              style={{
                borderRadius: 8,
                height: 36,
                width: 36
              }}
            />
          </Tooltip>
        </Space>
      ),
      align: 'center'
    }
  ];

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '24px'
    }}>
      {/* Header Card với SmileCare Design */}
      <Card 
        style={{ 
          marginBottom: 24,
          borderRadius: 16,
          boxShadow: smileCareTheme.shadows.lg,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: 'none'
        }}
        bodyStyle={{ padding: '24px 32px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center" size="large">
              <Button
                type="text"
                icon={<ArrowLeftOutlined style={{ fontSize: 20, color: '#fff' }} />}
                onClick={() => navigate('/rooms')}
                style={{ 
                  padding: '8px 16px',
                  color: '#fff',
                  height: 48,
                  borderRadius: 12,
                  fontWeight: 500,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Quay lại danh sách
              </Button>
              <Divider type="vertical" style={{ height: 40, background: 'rgba(255,255,255,0.3)' }} />
              <div>
                <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
                  <EnvironmentOutlined style={{ marginRight: 12 }} />
                  {room.name}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>
                  {room.hasSubRooms ? `Quản lý ${subRooms.length} buồng khám` : 'Phòng không chia buồng'}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Tag 
              color={room.isActive ? 'success' : 'error'}
              style={{ 
                padding: '8px 20px',
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 20,
                border: 'none'
              }}
              icon={room.isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            >
              {room.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Hiển thị thông tin phù hợp với loại phòng */}
      {room.hasSubRooms ? (
        <>
          {/* Thêm buồng mới - SmileCare Design */}
          <Card 
            style={{ 
              marginBottom: 20,
              borderRadius: 16,
              boxShadow: smileCareTheme.shadows.md,
              border: '2px solid #dbeafe',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
            }}
            bodyStyle={{ padding: '28px 32px' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}>
                  <PlusOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ margin: 0, color: smileCareTheme.colors.text.primary }}>
                    Thêm buồng khám mới
                  </Title>
                  <Text style={{ color: smileCareTheme.colors.text.secondary, fontSize: 14 }}>
                    Tạo thêm buồng để mở rộng phòng khám
                  </Text>
                </div>
              </div>

              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Space align="center" size="middle">
                    <Text strong style={{ fontSize: 15 }}>Số lượng buồng:</Text>
                    <InputNumber
                      min={1}
                      max={20}
                      value={addSubRoomCount}
                      onChange={setAddSubRoomCount}
                      size="large"
                      style={{ 
                        width: 120,
                        borderRadius: 8,
                        borderColor: smileCareTheme.colors.primary[300]
                      }}
                    />
                  </Space>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleAddSubRooms}
                    loading={isAddingSubRooms}
                    disabled={addSubRoomCount < 1}
                    style={{
                      height: 48,
                      borderRadius: 12,
                      fontWeight: 600,
                      padding: '0 32px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    Thêm buồng
                  </Button>
                </Col>
              </Row>

              <div style={{ 
                padding: '12px 16px',
                background: '#f0f9ff',
                borderRadius: 10,
                borderLeft: '4px solid #3b82f6'
              }}>
                <Space align="start">
                  <InfoCircleOutlined style={{ color: '#3b82f6', fontSize: 16, marginTop: 2 }} />
                  <Text style={{ color: smileCareTheme.colors.text.secondary, fontSize: 13 }}>
                    Buồng mới sẽ được đặt tên tự động và kích hoạt ngay. Bạn có thể chỉnh sửa sau.
                  </Text>
                </Space>
              </div>
            </Space>
          </Card>

          {/* Bảng danh sách buồng - SmileCare Design */}
          <Card 
            style={{ 
              borderRadius: 16,
              boxShadow: smileCareTheme.shadows.md,
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Table Header */}
            <div style={{ 
              padding: '20px 28px',
              background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space align="center">
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <HomeOutlined style={{ fontSize: 20, color: '#fff' }} />
                    </div>
                    <div>
                      <Title level={4} style={{ margin: 0, color: smileCareTheme.colors.text.primary }}>
                        Danh sách buồng khám
                      </Title>
                      <Text style={{ color: smileCareTheme.colors.text.secondary, fontSize: 13 }}>
                        Quản lý tất cả buồng trong phòng
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Tag 
                    color="blue" 
                    style={{ 
                      padding: '6px 16px',
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 8
                    }}
                  >
                    {filteredSubRooms.length} buồng
                  </Tag>
                </Col>
              </Row>
            </div>

            {/* Filter và Search */}
            <div style={{ padding: '20px 28px', background: '#fff' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={16} md={12} lg={8}>
                  <Input
                    placeholder="🔍 Tìm kiếm theo tên buồng..."
                    prefix={<SearchOutlined style={{ color: smileCareTheme.colors.primary[500] }} />}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    allowClear
                    size="large"
                    style={{ 
                      borderRadius: 10,
                      borderColor: smileCareTheme.colors.border.light
                    }}
                  />
                </Col>
                
                <Col xs={24} sm={8} md={6} lg={4}>
                  <Select
                    placeholder="Trạng thái"
                    value={filters.isActive}
                    onChange={(value) => handleFilterChange('isActive', value)}
                    allowClear
                    size="large"
                    style={{ 
                      width: '100%',
                      borderRadius: 10
                    }}
                  >
                    <Select.Option value={true}>✅ Hoạt động</Select.Option>
                    <Select.Option value={false}>⛔ Không hoạt động</Select.Option>
                  </Select>
                </Col>
              </Row>
            </div>

            {/* Table */}
            <div style={{ padding: '0 28px 28px' }}>
              <Table
                columns={columns}
                dataSource={filteredSubRooms}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} buồng`,
                  style: { marginTop: 16 }
                }}
                rowClassName={(record, index) => 
                  index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                }
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  overflow: 'hidden'
                }}
              />
            </div>
          </Card>
        </>
      ) : (
        /* Hiển thị thông tin phòng đơn - SmileCare Design */
        <Card 
          style={{ 
            borderRadius: 16,
            boxShadow: smileCareTheme.shadows.md,
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Header */}
          <div style={{ 
            padding: '20px 28px',
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <Space align="center">
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <InfoCircleOutlined style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: smileCareTheme.colors.text.primary }}>
                  Thông tin phòng khám
                </Title>
                <Text style={{ color: smileCareTheme.colors.text.secondary, fontSize: 13 }}>
                  Phòng không chia buồng - Cấu hình chung
                </Text>
              </div>
            </Space>
          </div>

          {/* Statistics */}
          <div style={{ padding: '32px 28px' }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  style={{ 
                    textAlign: 'center',
                    borderRadius: 12,
                    border: '2px solid #dbeafe',
                    background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                    boxShadow: smileCareTheme.shadows.sm
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    margin: '0 auto 16px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                  }}>
                    <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
                  </div>
                  <Statistic
                    title={<Text style={{ fontSize: 13, color: smileCareTheme.colors.text.secondary }}>Nha sĩ tối đa</Text>}
                    value={room.maxDoctors}
                    valueStyle={{ 
                      color: smileCareTheme.colors.primary[600], 
                      fontSize: 32,
                      fontWeight: 700
                    }}
                    suffix={<Text style={{ fontSize: 16, color: smileCareTheme.colors.text.tertiary }}>người</Text>}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  style={{ 
                    textAlign: 'center',
                    borderRadius: 12,
                    border: '2px solid #d1fae5',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                    boxShadow: smileCareTheme.shadows.sm
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    margin: '0 auto 16px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
                  }}>
                    <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
                  </div>
                  <Statistic
                    title={<Text style={{ fontSize: 13, color: smileCareTheme.colors.text.secondary }}>Y tá tối đa</Text>}
                    value={room.maxNurses}
                    valueStyle={{ 
                      color: smileCareTheme.colors.success[600], 
                      fontSize: 32,
                      fontWeight: 700
                    }}
                    suffix={<Text style={{ fontSize: 16, color: smileCareTheme.colors.text.tertiary }}>người</Text>}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={24} md={8}>
                <Card 
                  style={{ 
                    textAlign: 'center',
                    borderRadius: 12,
                    border: room.autoScheduleEnabled ? '2px solid #d1fae5' : '2px solid #fee2e2',
                    background: room.autoScheduleEnabled 
                      ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                    boxShadow: smileCareTheme.shadows.sm
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    margin: '0 auto 16px',
                    borderRadius: 14,
                    background: room.autoScheduleEnabled 
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: room.autoScheduleEnabled 
                      ? '0 4px 12px rgba(34, 197, 94, 0.4)'
                      : '0 4px 12px rgba(239, 68, 68, 0.4)'
                  }}>
                    {room.autoScheduleEnabled ? <CheckCircleOutlined style={{ fontSize: 28, color: '#fff' }} /> : <CloseCircleOutlined style={{ fontSize: 28, color: '#fff' }} />}
                  </div>
                  <Statistic
                    title={<Text style={{ fontSize: 13, color: smileCareTheme.colors.text.secondary }}>Tự động lịch</Text>}
                    value={room.autoScheduleEnabled ? 'Đang bật' : 'Đang tắt'}
                    valueStyle={{ 
                      color: room.autoScheduleEnabled ? smileCareTheme.colors.success[600] : smileCareTheme.colors.error[600], 
                      fontSize: 20,
                      fontWeight: 700
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
          
          {/* Info Note */}
          <div style={{ 
            padding: '20px 28px',
            background: '#f0f9ff',
            borderTop: '1px solid #e5e7eb'
          }}>
            <Space align="start">
              <InfoCircleOutlined style={{ color: smileCareTheme.colors.primary[500], fontSize: 16, marginTop: 2 }} />
              <Text style={{ color: smileCareTheme.colors.text.secondary, fontSize: 13 }}>
                <strong>Lưu ý:</strong> Đây là phòng không chia buồng. Tất cả hoạt động diễn ra trong một không gian chung.
              </Text>
            </Space>
          </div>
        </Card>
      )}

      {/* Toggle Status Modal - SmileCare Design */}
      <Modal
        title={
          <div style={{ 
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: selectedSubRoom?.isActive 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: selectedSubRoom?.isActive
                ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                : '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}>
              {selectedSubRoom?.isActive 
                ? <CloseCircleOutlined style={{ fontSize: 20, color: '#fff' }} />
                : <CheckCircleOutlined style={{ fontSize: 20, color: '#fff' }} />
              }
            </div>
            <Text strong style={{ fontSize: 16 }}>
              Xác nhận {selectedSubRoom?.isActive ? 'tắt' : 'bật'} buồng
            </Text>
          </div>
        }
        open={showToggleModal}
        onOk={handleConfirmToggle}
        onCancel={handleCancelToggle}
        okText={selectedSubRoom?.isActive ? 'Tắt buồng' : 'Bật buồng'}
        cancelText="Hủy"
        okType={selectedSubRoom?.isActive ? 'danger' : 'primary'}
        confirmLoading={selectedSubRoom ? toggleLoadingMap[selectedSubRoom._id] : false}
        centered
        width={520}
        okButtonProps={{
          style: {
            height: 40,
            borderRadius: 10,
            fontWeight: 600,
            padding: '0 24px'
          }
        }}
        cancelButtonProps={{
          style: {
            height: 40,
            borderRadius: 10,
            fontWeight: 600,
            padding: '0 24px'
          }
        }}
      >
        {selectedSubRoom && (
          <div style={{ padding: '12px 0' }}>
            <Text style={{ fontSize: 15, lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ 
                color: selectedSubRoom.isActive 
                  ? smileCareTheme.colors.error[600] 
                  : smileCareTheme.colors.success[600],
                fontSize: 16
              }}>
                {selectedSubRoom.isActive ? 'TẮT' : 'BẬT'}
              </strong>
              {' '}buồng{' '}
              <strong style={{ color: smileCareTheme.colors.primary[600] }}>
                "{selectedSubRoom.name}"
              </strong>?
            </Text>
            
            {selectedSubRoom.isActive && (
              <div style={{ 
                padding: '16px', 
                background: '#fff7ed',
                borderLeft: '4px solid #f59e0b',
                borderRadius: 10,
                marginTop: 20
              }}>
                <Space align="start">
                  <InfoCircleOutlined style={{ color: '#f59e0b', fontSize: 16, marginTop: 2 }} />
                  <Text style={{ color: '#92400e', fontSize: 13, lineHeight: 1.6 }}>
                    Buồng sẽ không còn khả dụng cho việc đặt lịch và sắp xếp bệnh nhân mới.
                  </Text>
                </Space>
              </div>
            )}
            {!selectedSubRoom.isActive && (
              <div style={{ 
                padding: '16px', 
                background: '#f0fdf4',
                borderLeft: '4px solid #22c55e',
                borderRadius: 10,
                marginTop: 20
              }}>
                <Space align="start">
                  <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 16, marginTop: 2 }} />
                  <Text style={{ color: '#166534', fontSize: 13, lineHeight: 1.6 }}>
                    Buồng sẽ được kích hoạt và sẵn sàng phục vụ bệnh nhân.
                  </Text>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal - SmileCare Design */}
      <Modal
        title={
          <div style={{ 
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}>
              <DeleteOutlined style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <Text strong style={{ fontSize: 16, color: smileCareTheme.colors.error[600] }}>
              Xác nhận xóa buồng
            </Text>
          </div>
        }
        open={showDeleteModal}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Xóa buồng"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleteLoading}
        centered
        width={520}
        okButtonProps={{
          style: {
            height: 40,
            borderRadius: 10,
            fontWeight: 600,
            padding: '0 24px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none'
          }
        }}
        cancelButtonProps={{
          style: {
            height: 40,
            borderRadius: 10,
            fontWeight: 600,
            padding: '0 24px'
          }
        }}
      >
        {selectedSubRoomForDelete && (
          <div style={{ padding: '12px 0' }}>
            <Text style={{ fontSize: 15, lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: smileCareTheme.colors.error[600], fontSize: 16 }}>
                XÓA
              </strong>
              {' '}buồng{' '}
              <strong style={{ color: smileCareTheme.colors.primary[600] }}>
                "{selectedSubRoomForDelete.name}"
              </strong>?
            </Text>
            
            {/* Warning Box */}
            <div style={{ 
              background: '#fef2f2',
              padding: '16px', 
              borderRadius: 10, 
              border: '2px solid #fecaca', 
              marginTop: 20
            }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {selectedSubRoomForDelete.hasBeenUsed && (
                  <Space align="start">
                    <InfoCircleOutlined style={{ color: smileCareTheme.colors.error[500], fontSize: 16, marginTop: 2 }} />
                    <Text style={{ color: smileCareTheme.colors.error[700], fontSize: 13, fontWeight: 600 }}>
                      Buồng này đã được sử dụng trong hệ thống
                    </Text>
                  </Space>
                )}
                
                <Space align="start">
                  <CloseCircleOutlined style={{ color: smileCareTheme.colors.error[500], fontSize: 16, marginTop: 2 }} />
                  <Text style={{ color: smileCareTheme.colors.error[700], fontSize: 13, fontWeight: 600 }}>
                    Hành động này không thể hoàn tác!
                  </Text>
                </Space>
              </Space>
            </div>

            {/* Suggestion Box */}
            <div style={{ 
              marginTop: 16,
              padding: '16px',
              background: '#f0f9ff',
              borderRadius: 10,
              borderLeft: '4px solid #3b82f6'
            }}>
              <Space align="start">
                <InfoCircleOutlined style={{ color: smileCareTheme.colors.primary[500], fontSize: 16, marginTop: 2 }} />
                <Text style={{ color: smileCareTheme.colors.text.secondary, fontSize: 13, lineHeight: 1.6 }}>
                  <strong>Gợi ý:</strong> Nếu bạn chỉ muốn tạm thời ngưng sử dụng buồng, hãy <strong style={{ color: smileCareTheme.colors.primary[600] }}>TẮT</strong> thay vì xóa.
                </Text>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RoomManagement;
