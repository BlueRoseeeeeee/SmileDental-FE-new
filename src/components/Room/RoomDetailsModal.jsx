/*
* @author: HoTram
* @updated: SmileCare Design System Polish
*/
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Input,
  Select,
} from 'antd';
import { toast } from '../../services/toastService';
import {
  EnvironmentOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import roomService from '../../services/roomService';
import { searchAndFilter } from '../../utils/searchUtils';
import smileCareTheme from '../../theme/smileCareTheme';

const { Title, Text } = Typography;

const RoomDetailsModal = ({ 
  open, 
  onClose, 
  roomId, 
  roomData 
}) => {
  const [room, setRoom] = useState(null);
  const [subRooms, setSubRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isActive: null,
    hasBeenUsed: null
  });
  const [filteredSubRooms, setFilteredSubRooms] = useState([]);

  useEffect(() => {
    if (open && roomId) {
      fetchRoomDetails();
    }
  }, [open, roomId]);

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
  ];

  if (!room) {
    return null;
  }

  return (
    <>
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              <EnvironmentOutlined style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                  {room.name}
                </Title>
                <Tag 
                  color={room.isActive ? 'success' : 'error'}
                  style={{ 
                    padding: '4px 12px',
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 6
                  }}
                  icon={room.isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                >
                  {room.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </Tag>
              </div>
              <Text style={{ color: '#6b7280', fontSize: 13 }}>
                {room.hasSubRooms ? `${subRooms.length} buồng khám` : 'Phòng không chia buồng'}
              </Text>
            </div>
          </div>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={900}
        centered
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>

          {/* Hiển thị thông tin phù hợp với loại phòng */}
          {room.hasSubRooms ? (
            <>
              {/* Statistics cho phòng có buồng */}
              <div style={{ 
                marginBottom: 24,
                padding: '24px',
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <Title level={5} style={{ marginBottom: 16, color: '#1f2937' }}>
                  Thống kê tổng quan
                </Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      textAlign: 'center',
                      padding: '20px',
                      background: '#f0f9ff',
                      borderRadius: 8,
                      border: '1px solid #dbeafe'
                    }}>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Tổng số buồng</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#1e40af' }}>
                        {subRooms.length}
                      </div>
                    </div>
                  </Col>
                  
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      textAlign: 'center',
                      padding: '20px',
                      background: '#f0fdf4',
                      borderRadius: 8,
                      border: '1px solid #d1fae5'
                    }}>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Buồng hoạt động</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#16a34a' }}>
                        {subRooms.filter(r => r.isActive).length}
                      </div>
                    </div>
                  </Col>
                  
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      textAlign: 'center',
                      padding: '20px',
                      background: '#fef2f2',
                      borderRadius: 8,
                      border: '1px solid #fecaca'
                    }}>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Buồng ngưng hoạt động</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#dc2626' }}>
                        {subRooms.filter(r => !r.isActive).length}
                      </div>
                    </div>
                  </Col>
                  
                </Row>
              </div>

              {/* Bảng danh sách buồng */}
              <div style={{ 
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                {/* Header đơn giản */}
                <div style={{ 
                  padding: '20px 24px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <Title level={5} style={{ margin: 0, color: '#1f2937' }}>
                    Danh sách buồng khám
                  </Title>
                </div>

                {/* Filter và Search */}
                <div style={{ padding: '20px 24px', background: '#fff' }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12}>
                      <Input
                        placeholder="Tìm kiếm theo tên buồng..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        allowClear
                        style={{ borderRadius: 8 }}
                      />
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Select
                        placeholder="Trạng thái"
                        value={filters.isActive}
                        onChange={(value) => handleFilterChange('isActive', value)}
                        allowClear
                        style={{ width: '100%', borderRadius: 8 }}
                      >
                        <Select.Option value={true}>Hoạt động</Select.Option>
                        <Select.Option value={false}>Không hoạt động</Select.Option>
                      </Select>
                    </Col>
                  </Row>
                </div>

                {/* Table */}
                <div style={{ padding: '0 24px 24px' }}>
                  <Table
                    columns={columns}
                    dataSource={filteredSubRooms}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} của ${total} buồng`,
                      style: { marginTop: 16 }
                    }}
                    style={{ background: '#fff' }}
                  />
                </div>
              </div>
            </>
          ) : (
            /* Hiển thị thông tin phòng đơn */
            <div style={{ 
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ 
                padding: '20px 24px',
                background: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <InfoCircleOutlined style={{ fontSize: 18, color: '#fff' }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, color: '#1f2937' }}>
                    Thông tin phòng khám
                  </Title>
                  <Text style={{ color: '#6b7280', fontSize: 13 }}>
                    Phòng không chia buồng - Cấu hình chung
                  </Text>
                </div>
              </div>

              {/* Statistics cho phòng đơn */}
              <div style={{ padding: '24px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px' 
                }}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    background: '#f0f9ff',
                    borderRadius: 8,
                    border: '1px solid #dbeafe',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      margin: '0 auto 12px',
                      borderRadius: 8,
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <UserOutlined style={{ fontSize: 24, color: '#fff' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                      {room.maxDoctors}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Nha sĩ tối đa</div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    background: '#f0fdf4',
                    borderRadius: 8,
                    border: '1px solid #d1fae5',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      margin: '0 auto 12px',
                      borderRadius: 8,
                      background: '#22c55e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <UserOutlined style={{ fontSize: 24, color: '#fff' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>
                      {room.maxNurses}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Y tá tối đa</div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    background: room.autoScheduleEnabled ? '#f0fdf4' : '#fef2f2',
                    borderRadius: 8,
                    border: room.autoScheduleEnabled ? '1px solid #d1fae5' : '1px solid #fecaca',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      margin: '0 auto 12px',
                      borderRadius: 8,
                      background: room.autoScheduleEnabled ? '#22c55e' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {room.autoScheduleEnabled ? 
                        <CheckCircleOutlined style={{ fontSize: 24, color: '#fff' }} /> : 
                        <CloseCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
                      }
                    </div>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: room.autoScheduleEnabled ? '#16a34a' : '#dc2626', 
                      marginBottom: 4 
                    }}>
                      {room.autoScheduleEnabled ? 'Đang bật' : 'Đang tắt'}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Tự động lịch</div>
                  </div>
                </div>
              </div>
              
              {/* Info Note */}
              <div style={{ 
                padding: '16px 24px',
                background: '#f0f9ff',
                borderTop: '1px solid #e5e7eb'
              }}>
                <Space align="start">
                  <InfoCircleOutlined style={{ color: '#3b82f6', fontSize: 14, marginTop: 2 }} />
                  <Text style={{ color: '#6b7280', fontSize: 13 }}>
                    <strong>Lưu ý:</strong> Đây là phòng không chia buồng. Tất cả hoạt động diễn ra trong một không gian chung.
                  </Text>
                </Space>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </>
  );
};

export default RoomDetailsModal;
