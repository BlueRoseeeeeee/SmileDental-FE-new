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
  Modal,
  Tooltip,
  Switch,
  Input,
  Select
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
  SettingOutlined
} from '@ant-design/icons';
import roomService from '../services/roomService';
import RoomFormModal from '../components/Room/RoomFormModal';
import { searchAndFilter, debounce } from '../utils/searchUtils';

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
  }, [pagination.current, pagination.pageSize]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await roomService.getRooms(pagination.current, pagination.pageSize);
      
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
    navigate(`/rooms/${room._id}`);
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      
      const response = await roomService.deleteRoom(roomId);
      toast.success(response.message || 'Xóa phòng khám thành công');
      
      // Refresh danh sách phòng để cập nhật UI và thống kê
      fetchRooms();
    } catch (error) {
      console.error(' Delete room error:', error);
      toast.error('Lỗi khi xóa phòng khám: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (room) => {
    try {
      console.log(' Toggle room status:', { roomId: room._id, currentStatus: room.isActive });
      
      // Set loading cho room cụ thể
      setToggleLoadingMap(prev => ({ ...prev, [room._id]: true }));
      
      const updatedRoom = await roomService.toggleRoomStatus(room._id);
      console.log('Room toggle response:', updatedRoom);
      
      const newStatus = updatedRoom.isActive ? 'kích hoạt' : 'vô hiệu hóa';
      toast.success(`Đã ${newStatus} phòng khám "${room.name}"`);
      
      // Refresh danh sách phòng để cập nhật UI
      fetchRooms();
    } catch (error) {
      console.error('Room toggle error:', error);
      toast.error('Lỗi khi cập nhật trạng thái: ' + (error.response?.data?.message || error.message));
    } finally {
      // Clear loading cho room cụ thể
      setToggleLoadingMap(prev => ({ ...prev, [room._id]: false }));
    }
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
                <SettingOutlined /> {record.maxDoctors} bác sĩ, {record.maxNurses} y tá
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
          {hasSubRooms ? 'Có buồng con' : 'Phòng đơn'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => (
        <Space>
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Hoạt động' : 'Không hoạt động'}
          </Tag>
          {record.hasBeenUsed && (
            <Tag color="orange">Đã sử dụng</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
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
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Tooltip>
          
          <Popconfirm
            title={`Xóa phòng "${record.name}"?`}
            description={
              record.hasBeenUsed 
                ? "⚠️ Phòng đã được sử dụng. Việc xóa có thể ảnh hưởng đến dữ liệu lịch sử. Bạn có chắc chắn?" 
                : record.hasSubRooms 
                  ? `🗑️ Phòng này có ${record.subRooms?.length || 0} buồng con. Tất cả sẽ bị xóa và không thể hoàn tác.`
                  : "🗑️ Hành động này không thể hoàn tác. Bạn có chắc chắn?"
            }
            onConfirm={() => handleDeleteRoom(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              Quản lý phòng khám
            </Title>
            <Text type="secondary">Quản lý danh sách phòng khám trong hệ thống</Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateRoom}
              size="large"
            >
              Thêm phòng mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Search & Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Tìm kiếm phòng..."
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Trạng thái"
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
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Loại phòng"
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
              <Select.Option value="true">Có phòng con</Select.Option>
              <Select.Option value="false">Phòng đơn</Select.Option>
            </Select>
          </Col>

        </Row>
        {(searchTerm || statusFilter || typeFilter) && (
          <div style={{ marginTop: 16, padding: '8px 12px', backgroundColor: '#f6f8fa', borderRadius: 6 }}>
            <Text type="secondary">
              Hiển thị {filteredRooms.length} / {rooms.length} phòng
              {searchTerm && ` • Tìm kiếm: "${searchTerm}"`}
              {statusFilter && ` • Trạng thái: ${statusFilter === 'true' ? 'Hoạt động' : 'Không hoạt động'}`}
              {typeFilter && ` • Loại: ${typeFilter === 'true' ? 'Có phòng con' : 'Phòng đơn'}`}
            </Text>
          </div>
        )}
      </Card>

      {/* Bảng danh sách */}
      <Card title="Danh sách phòng khám">
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
            }
          }}
        />
      </Card>

      {/* Modal tạo/sửa phòng */}
      <RoomFormModal
        visible={isModalVisible}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        room={editingRoom}
      />

    </div>
  );
};

export default RoomList;
