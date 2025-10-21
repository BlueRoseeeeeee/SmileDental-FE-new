/*
* @author: HoTram
*/
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, 
  Card, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Tag,
  Popconfirm,
  Tooltip,
  Switch,
  Input,
  Select,
  Modal
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { toast } from '../services/toastService';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import roomService from '../services/roomService';
import RoomFormModal from '../components/Room/RoomFormModal';
import { searchAndFilter, debounce } from '../utils/searchUtils';
import dayjs from 'dayjs';
const { Title, Text } = Typography;

const RoomList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [toggleLoadingMap, setToggleLoadingMap] = useState({});

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Toggle confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoomForDelete, setSelectedRoomForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filtered data using searchUtils
  const filteredRooms = useMemo(() => {
    const searchFields = ['name', 'description'];
    const filters = {};

    if (statusFilter !== '') {
      filters.isActive = statusFilter === 'true';
    }

    if (typeFilter !== '') {
      filters.hasSubRooms = typeFilter === 'true';
    }

    return searchAndFilter(rooms, searchTerm, searchFields, filters);
  }, [rooms, searchTerm, statusFilter, typeFilter]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term);
      if (!term) {
        setPagination(prev => ({ ...prev, current: 1 }));
      }
    }, 300),
    []
  );



  useEffect(() => {
    fetchRooms();
  }, [pagination.current, pagination.pageSize, searchTerm, statusFilter, typeFilter]); // 🔥 Add all filter dependencies


  const fetchRooms = async () => {
    setLoading(true);
    try {
      // 🔥 When searching or filtering, fetch ALL rooms to enable search across all pages
      const shouldFetchAll = searchTerm.trim() !== '' || statusFilter !== '' || typeFilter !== '';
      
      const response = await roomService.getRooms(
        shouldFetchAll ? 1 : pagination.current, 
        shouldFetchAll ? 9999 : pagination.pageSize
      );
      
      setRooms(response.rooms || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      toast.error('Lỗi khi tải danh sách phòng khám: ' + (error.response?.data?.message || error.message));
      
      // Set empty data on error
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setIsModalVisible(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setIsModalVisible(true);
  };

  const handleViewSubRooms = (room) => {
    navigate(`/dashboard/rooms/${room._id}`);
  };

  // Handle show delete confirmation modal
  const handleDeleteRoom = (room) => {
    setSelectedRoomForDelete(room);
    setShowDeleteModal(true);
  };

  // Handle confirm delete room
  const handleConfirmDelete = async () => {
    if (!selectedRoomForDelete) return;
    
    try {
      setDeleteLoading(true);
      const response = await roomService.deleteRoom(selectedRoomForDelete._id);
      toast.success(response.message || `Đã xóa phòng "${selectedRoomForDelete.name}" thành công`);
      
      // Refresh danh sách phòng để cập nhật UI và thống kê
      fetchRooms();
    } catch (error) {
      console.error(' Delete room error:', error);
      toast.error('Lỗi khi xóa phòng khám: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedRoomForDelete(null);
    }
  };

  // Handle cancel delete confirmation
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedRoomForDelete(null);
  };

  // Handle show confirmation modal
  const handleToggleStatus = (room) => {
    setSelectedRoom(room);
    setShowConfirmModal(true);
  };

  // Handle confirm toggle room status
  const handleConfirmToggle = async () => {
    if (!selectedRoom) return;
    
    try {
      console.log(' Toggle room status:', { roomId: selectedRoom._id, currentStatus: selectedRoom.isActive });
      
      // Set loading cho room cụ thể
      setToggleLoadingMap(prev => ({ ...prev, [selectedRoom._id]: true }));
      
      const updatedRoom = await roomService.toggleRoomStatus(selectedRoom._id);
      console.log('Room toggle response:', updatedRoom);
      
      const newStatus = updatedRoom.isActive ? 'kích hoạt' : 'vô hiệu hóa';
      toast.success(`Đã ${newStatus} phòng khám "${selectedRoom.name}" thành công!`);
      
      // Refresh danh sách phòng để cập nhật UI
      fetchRooms();
    } catch (error) {
      console.error('Room toggle error:', error);
      toast.error('Lỗi khi cập nhật trạng thái: ' + (error.response?.data?.message || error.message));
    } finally {
      // Clear loading cho room cụ thể
      setToggleLoadingMap(prev => ({ ...prev, [selectedRoom._id]: false }));
      setShowConfirmModal(false);
      setSelectedRoom(null);
    }
  };

  // Handle cancel confirmation
  const handleCancelToggle = () => {
    setShowConfirmModal(false);
    setSelectedRoom(null);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingRoom(null);
  };


  const handleSuccess = () => {
    fetchRooms();
    handleModalClose();
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 60
    },
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.hasSubRooms && (
            <div>
              <Tag color="blue" size="small">
                <HomeOutlined /> {record.subRooms?.length || 0} buồng
              </Tag>
            </div>
          )}
          {!record.hasSubRooms && (
            <div>
              <Tag color="green" size="small">
                <SettingOutlined /> {record.maxDoctors} nha sĩ, {record.maxNurses} y tá
              </Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Loại phòng',
      dataIndex: 'hasSubRooms',
      key: 'hasSubRooms',
      render: (hasSubRooms) => (
        <Tag color={hasSubRooms ? 'blue' : 'green'}>
          {hasSubRooms ? 'Có buồng' : 'Không buồng'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewSubRooms(record)}
            />
          </Tooltip>
          
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditRoom(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.isActive ? 'Vô hiệu hóa phòng' : 'Kích hoạt phòng'}>
            <Switch
              size="small"
              checked={record.isActive}
              loading={toggleLoadingMap[record._id]}
              onChange={() => handleToggleStatus(record)}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
            />
          </Tooltip>
          
          <Tooltip title={record.hasBeenUsed ? 'Phòng đã được sử dụng, không thể xóa' : 'Xóa phòng'}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={record.hasBeenUsed}
              onClick={() => handleDeleteRoom(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Search & Filter */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div>
              <Text style={{ display: 'block', marginBottom: 8 , fontSize:12}}>Tìm kiếm</Text>
              <Input
                placeholder="Tìm kiếm theo tên phòng, mô tả..."
                prefix={<SearchOutlined />}
                allowClear
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text style={{ display: 'block', marginBottom: 8 ,fontSize:12}}>Lọc theo trạng thái</Text>
              <Select
                placeholder="Chọn trạng thái"
                allowClear
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value || '');
                  if (!value) {
                    setPagination(prev => ({ ...prev, current: 1 }));
                  }
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="true">Hoạt động</Select.Option>
                <Select.Option value="false">Không hoạt động</Select.Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text style={{ display: 'block', marginBottom: 8, fontSize:12 }}>Lọc theo loại phòng</Text>
              <Select
                placeholder="Chọn loại phòng"
                allowClear
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value || '');
                  if (!value) {
                    setPagination(prev => ({ ...prev, current: 1 }));
                  }
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="true">Có buồng</Select.Option>
                <Select.Option value="false">Không buồng</Select.Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Bảng danh sách */}
      <Card >
      <div style={{marginBottom:16, display:'flex', alignItems:'center', gap:12, justifyContent:'space-between'}}>
      <div style={{display:'flex', alignItems:'center', gap:7}}>
      <EnvironmentOutlined style={{fontSize:18, color:'#1890ff'}} />
        <Title level={4} style={{fontSize:16, margin:0}}>Danh sách phòng</Title>
      </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateRoom}
        >
          Thêm phòng mới
        </Button>

      </div>
        <Table
          columns={columns}
          dataSource={filteredRooms}
          rowKey="_id"
          loading={loading}
          pagination={
            (searchTerm || statusFilter || typeFilter) 
              ? false 
              : {
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} phòng khám`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10
              }));
              fetchRooms(); // 🔥 This will be triggered by useEffect dependency
            }
          }}
        />
      </Card>

      {/* Modal tạo/sửa phòng */}
      <RoomFormModal
        open={isModalVisible}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        room={editingRoom}
      />

      {/* Confirmation Modal */}
      <Modal
        title="Xác nhận thay đổi trạng thái phòng"
        open={showConfirmModal}
        onOk={handleConfirmToggle}
        onCancel={handleCancelToggle}
        okText={selectedRoom?.isActive ? 'Tắt phòng' : 'Bật phòng'}
        cancelText="Hủy"
        okType={selectedRoom?.isActive ? 'danger' : 'primary'}
        confirmLoading={selectedRoom ? toggleLoadingMap[selectedRoom._id] : false}
      >
        {selectedRoom && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: selectedRoom.isActive ? '#ff4d4f' : '#52c41a' }}>
                {selectedRoom.isActive ? 'TẮT' : 'BẬT'}
              </strong>
              {' '}phòng khám{' '}
              <strong>"{selectedRoom.name}"</strong>?
            </p>
            {selectedRoom.isActive && (
              <div>
                <p style={{ color: '#faad14', fontSize: 12 }}>
                   Phòng sẽ không còn khả dụng cho việc đặt lịch và sắp xếp bệnh nhân.
                </p>
                {selectedRoom.hasSubRooms && (
                  <p style={{ color: '#ff4d4f', fontSize: 12 }}>
                     Phòng này có {selectedRoom.subRooms?.length || 0} buồng con sẽ bị ảnh hưởng.
                  </p>
                )}
              </div>
            )}
            {!selectedRoom.isActive && (
              <p style={{ color: '#52c41a', fontSize: 12 }}>
                 Phòng sẽ được kích hoạt và sẵn sàng phục vụ bệnh nhân.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title=" Xác nhận xóa phòng khám"
        open={showDeleteModal}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Xóa phòng"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleteLoading}
      >
        {selectedRoomForDelete && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: '#ff4d4f' }}>XÓA</strong>
              {' '}phòng khám{' '}
              <strong>"{selectedRoomForDelete.name}"</strong>?
            </p>
            
            <div style={{ backgroundColor: '#fff2f0', padding: 12, borderRadius: 6, border: '1px solid #ffccc7', marginTop: 16 }}>
              {selectedRoomForDelete.hasBeenUsed && (
                <p style={{ color: '#ff4d4f', fontSize: 12, margin: '0 0 8px 0' }}>
                   <strong>Phòng đã được sử dụng:</strong> Việc xóa có thể ảnh hưởng đến dữ liệu lịch sử và báo cáo.
                </p>
              )}
              
              {selectedRoomForDelete.hasSubRooms && (
                <p style={{ color: '#ff4d4f', fontSize: 12, margin: '0 0 8px 0' }}>
                   <strong>Phòng có {selectedRoomForDelete.subRooms?.length || 0} buồng con:</strong> Tất cả buồng con sẽ bị xóa cùng.
                </p>
              )}
              
              <p style={{ color: '#ff4d4f', fontSize: 12, margin: 0 }}>
                 <strong>Hành động này không thể hoàn tác!</strong>
              </p>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
              Nếu bạn chỉ muốn tạm thời ngưng sử dụng phòng, hãy <strong>TẮT</strong> thay vì xóa.
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default RoomList;
