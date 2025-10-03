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
  Switch,
  Modal,
  Tooltip
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
            <Tooltip title={record.isActive ? 'Tắt buồng' : 'Bật buồng'}>
              <Switch
                size="small"
                checked={record.isActive}
                loading={toggleLoadingMap[record._id]}
                onChange={() => handleToggleSubRoomStatus(record)}
                checkedChildren="Bật"
                unCheckedChildren="Tắt"
              />
            </Tooltip>
            
            <Tooltip title={record.hasBeenUsed ? 'Không thể xóa buồng đã sử dụng' : 'Xóa buồng'}>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={record.hasBeenUsed}
                onClick={() => handleDeleteSubRoom(record)}
              />
            </Tooltip>
          </Space>
        )
      }
  ];

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
     
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/rooms')}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>

      {/* Thông tin phòng */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>
              <EnvironmentOutlined /> {room.name} ({room.hasSubRooms ? `${subRooms.length} buồng` : 'Phòng đơn'})
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

      {/* Toggle Status Modal */}
      <Modal
        title="Xác nhận thay đổi trạng thái buồng"
        open={showToggleModal}
        onOk={handleConfirmToggle}
        onCancel={handleCancelToggle}
        okText={selectedSubRoom?.isActive ? 'Tắt buồng' : 'Bật buồng'}
        cancelText="Hủy"
        okType={selectedSubRoom?.isActive ? 'danger' : 'primary'}
        confirmLoading={selectedSubRoom ? toggleLoadingMap[selectedSubRoom._id] : false}
        centered
      >
        {selectedSubRoom && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: selectedSubRoom.isActive ? '#ff4d4f' : '#52c41a' }}>
                {selectedSubRoom.isActive ? 'TẮT' : 'BẬT'}
              </strong>
              {' '}buồng{' '}
              <strong>"{selectedSubRoom.name}"</strong>?
            </p>
            {selectedSubRoom.isActive && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fff2e8', 
                borderLeft: '4px solid #ff7a00',
                borderRadius: '4px',
                marginTop: '12px'
              }}>
                <p style={{ margin: 0, color: '#d46b08', fontSize: '12px' }}>
                   Buồng sẽ không còn khả dụng cho việc đặt lịch và sắp xếp bệnh nhân.
                </p>
              </div>
            )}
            {!selectedSubRoom.isActive && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f6ffed', 
                borderLeft: '4px solid #52c41a',
                borderRadius: '4px',
                marginTop: '12px'
              }}>
                <p style={{ margin: 0, color: '#389e0d', fontSize: '12px' }}>
                   Buồng sẽ được kích hoạt và sẵn sàng phục vụ bệnh nhân.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa buồng"
        open={showDeleteModal}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Xóa buồng"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleteLoading}
        centered
      >
        {selectedSubRoomForDelete && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: '#ff4d4f' }}>XÓA</strong>
              {' '}buồng{' '}
              <strong>"{selectedSubRoomForDelete.name}"</strong>?
            </p>
            
            <div style={{ 
              backgroundColor: '#fff2f0', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ffccc7', 
              marginTop: '16px' 
            }}>
              {selectedSubRoomForDelete.hasBeenUsed && (
                <p style={{ color: '#ff4d4f', fontSize: '12px', margin: '0 0 8px 0' }}>
                   <strong>Buồng đã được sử dụng</strong> 
                </p>
              )}
              
              <p style={{ color: '#ff4d4f', fontSize: '12px', margin: 0 }}>
                 <strong>Hành động này không thể hoàn tác!</strong>
              </p>
            </div>

            <p style={{ marginTop: '16px', fontSize: '13px', color: '#666' }}>
              Nếu bạn chỉ muốn tạm thời ngưng sử dụng buồng, hãy <strong>TẮT</strong> thay vì xóa.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RoomManagement;
