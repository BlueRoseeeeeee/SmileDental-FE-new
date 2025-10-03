/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  InputNumber,
  Switch
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
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import roomService from '../services/roomService';

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
  const [deleteLoadingMap, setDeleteLoadingMap] = useState({});

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

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

  const handleToggleSubRoomStatus = async (subRoomId, currentStatus) => {
    console.log('Toggle clicked:', { subRoomId, currentStatus, roomId: room._id });
    
    // Debug: Check if token exists
    const token = localStorage.getItem('accessToken');
    console.log('Auth token:', token ? 'EXISTS' : 'MISSING');
    
    try {
      // Set loading cho button cụ thể
      setToggleLoadingMap(prev => ({ ...prev, [subRoomId]: true }));
      
      console.log('Making API call...');
      const updatedRoom = await roomService.toggleSubRoomStatus(room._id, subRoomId);
      console.log('API response:', updatedRoom);
      
      // Update local state với dữ liệu mới từ server
      setRoom(updatedRoom);
      setSubRooms(updatedRoom.subRooms || []);
      
      const newStatus = !currentStatus ? 'kích hoạt' : 'tắt';
      toast.success(`Đã ${newStatus} buồng thành công`);
    } catch (error) {
      toast.error('Lỗi khi thay đổi trạng thái buồng: ' + (error.response?.data?.message || error.message));
    } finally {
      // Clear loading cho button cụ thể
      setToggleLoadingMap(prev => ({ ...prev, [subRoomId]: false }));
    }
  };

  const handleDeleteSubRoom = async (subRoomId) => {
    try {
      // Set loading cho button cụ thể
      setDeleteLoadingMap(prev => ({ ...prev, [subRoomId]: true }));
      const response = await roomService.deleteSubRoom(room._id, subRoomId);
      // Update local state với room data mới từ server
      if (response.room) {
        setRoom(response.room);
        setSubRooms(response.room.subRooms || []);
      }
      
      toast.success(response.message || 'Đã xóa buồng thành công');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Lỗi khi xóa buồng: ' + (error.response?.data?.message || error.message));
    } finally {
      // Clear loading cho button cụ thể
      setDeleteLoadingMap(prev => ({ ...prev, [subRoomId]: false }));
    }
  };

  const columns = [
    {
      title: 'Tên buồng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <HomeOutlined />
          <Text strong>{text}</Text>
          {record.hasBeenUsed && (
            <Tag color="orange" size="small">Đã sử dụng</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
      {
        title: 'Thao tác',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Switch
              size="small"
              checked={record.isActive}
              loading={toggleLoadingMap[record._id]}
              onChange={() => handleToggleSubRoomStatus(record._id, record.isActive)}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
            
            <Popconfirm
              title={`Xóa "${record.name}"?`}
              description={
                record.hasBeenUsed 
                  ? " Buồng đã được sử dụng, không thể xóa" 
                  : " Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa buồng này?"
              }
              onConfirm={() => handleDeleteSubRoom(record._id)}
              disabled={record.hasBeenUsed || deleteLoadingMap[record._id]}
              okText="Xóa"
              cancelText="Hủy"
              okType="danger"
              okButtonProps={{
                loading: deleteLoadingMap[record._id]
              }}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deleteLoadingMap[record._id]}
                disabled={record.hasBeenUsed}
              />
            </Popconfirm>
          </Space>
        )
      }
  ];

  const stats = {
    total: subRooms.length,
    active: subRooms.filter(sr => sr.isActive).length,
    inactive: subRooms.filter(sr => !sr.isActive).length,
    used: subRooms.filter(sr => sr.hasBeenUsed).length
  };

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/rooms')}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <HomeOutlined style={{ marginRight: 8 }} />
              {room.name}
            </Title>
            <Text type="secondary">
              {room.hasSubRooms ? `Quản lý ${subRooms.length} buồng` : 'Phòng đơn'}
            </Text>
          </Col>
          <Col>
            <Button 
              onClick={fetchRoomDetails}
              loading={loading}
              icon={<ReloadOutlined />}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Thông tin phòng */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>
              <EnvironmentOutlined /> {room.name}
            </Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Tag color={room.isActive ? 'green' : 'red'}>
              {room.isActive ? 'Hoạt động' : 'Không hoạt động'}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Hiển thị thông tin phù hợp với loại phòng */}
      {room.hasSubRooms ? (
        <>
          {/* Thống kê cho phòng có buồng con */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Tổng buồng"
                  value={stats.total}
                  prefix={<HomeOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Hoạt động"
                  value={stats.active}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Không hoạt động"
                  value={stats.inactive}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Đã sử dụng"
                  value={stats.used}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Thêm buồng mới */}
          <Card 
            title="Thêm buồng mới"
            size="small" 
            style={{ marginBottom: 16 }}
          >
            <Row gutter={12} align="middle">
              <Col flex="auto">
                <Text>Nhập số lượng buồng bạn muốn thêm:</Text>
                <InputNumber
                  min={1}
                  max={10}
                  value={addSubRoomCount}
                  onChange={setAddSubRoomCount}
                  style={{ width: 100, marginLeft: 8 }}
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddSubRooms}
                  loading={isAddingSubRooms}
                  disabled={addSubRoomCount < 1}
                >
                  Thêm
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Bảng danh sách buồng */}
          <Card title="Danh sách buồng" size="small">
            <Table
              columns={columns}
              dataSource={subRooms}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} buồng`
              }}
              size="small"
            />
          </Card>
        </>
      ) : (
        /* Hiển thị thông tin phòng đơn */
        <Card title="Thông tin phòng đơn" size="small">
          <Row gutter={24}>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="Bác sĩ tối đa"
                  value={room.maxDoctors}
                  prefix={<EnvironmentOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="Y tá tối đa"
                  value={room.maxNurses}
                  prefix={<EnvironmentOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="Tự động lịch"
                  value={room.autoScheduleEnabled ? 'Bật' : 'Tắt'}
                  valueStyle={{ 
                    color: room.autoScheduleEnabled ? '#52c41a' : '#ff4d4f',
                    fontSize: '18px'
                  }}
                />
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <Row>
            <Col span={24}>
              <Text type="secondary">
                <strong>Ghi chú:</strong> Đây là phòng đơn không có buồng con. 
              </Text>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default RoomManagement;
