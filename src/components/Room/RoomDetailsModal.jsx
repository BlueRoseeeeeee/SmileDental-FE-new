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
  Tabs,
} from 'antd';
import { toast } from '../../services/toastService';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
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
  const [activeTab, setActiveTab] = useState('active'); // 'active' hoặc 'inactive'
  const [filteredSubRooms, setFilteredSubRooms] = useState([]);

  useEffect(() => {
    if (open && roomId) {
      fetchRoomDetails();
    }
  }, [open, roomId]);

  // Effect để filter dữ liệu khi searchTerm hoặc activeTab thay đổi
  useEffect(() => {
    let filtered = subRooms;
    
    // Filter theo tab
    if (activeTab === 'active') {
      filtered = filtered.filter(room => room.isActive);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(room => !room.isActive);
    }
    
    // Filter theo search term
    if (searchTerm.trim()) {
      const searchFields = ['name'];
      filtered = searchAndFilter(filtered, searchTerm, searchFields, {});
    }
    
    setFilteredSubRooms(filtered);
  }, [subRooms, searchTerm, activeTab]);

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

  const columns = [
    {
      title: <Text strong style={{ fontSize: 13 }}>STT</Text>,
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => index + 1,
      width: 60,
      align: 'center'
    },
    {
      title: <Text strong style={{ fontSize: 13 }}>Tên buồng khám</Text>,
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Text strong style={{ fontSize: 14 }}>{text}</Text>
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                >
                  {room.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </Tag>
              </div>
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
        <div style={{ maxHeight: '80vh', overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Thông tin chi tiết phòng */}
          <div style={{ 
            marginBottom: 24,
            padding: '20px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <Title level={5} style={{ marginBottom: 16, color: '#1f2937' }}>
              Thông tin chi tiết
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: '#1f2937' }}>
                    Cấu trúc phòng: <Text strong>{room?.hasSubRooms ? 'Có buồng' : 'Không buồng'}</Text>
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: '#1f2937' }}>
                    Loại phòng: <Text strong>
                      {room?.roomType === 'CONSULTATION' && 'Phòng tư vấn/khám'}
                      {room?.roomType === 'GENERAL_TREATMENT' && 'Phòng điều trị TQ'}
                      {room?.roomType === 'SURGERY' && 'Phòng phẫu thuật'}
                      {room?.roomType === 'ORTHODONTIC' && 'Phòng chỉnh nha'}
                      {room?.roomType === 'COSMETIC' && 'Phòng thẩm mỹ'}
                      {room?.roomType === 'PEDIATRIC' && 'Phòng nha nhi'}
                      {room?.roomType === 'X_RAY' && 'Phòng X-quang'}
                      {room?.roomType === 'STERILIZATION' && 'Phòng tiệt trùng'}
                      {room?.roomType === 'LAB' && 'Phòng labo'}
                      {room?.roomType === 'RECOVERY' && 'Phòng hồi sức'}
                      {room?.roomType === 'SUPPORT' && 'Phòng phụ trợ'}
                      {!['CONSULTATION', 'GENERAL_TREATMENT', 'SURGERY', 'ORTHODONTIC', 'COSMETIC', 'PEDIATRIC', 'X_RAY', 'STERILIZATION', 'LAB', 'RECOVERY', 'SUPPORT'].includes(room?.roomType) && room?.roomType}
                    </Text>
                  </Text>
                </div>
              </Col>
            </Row>
          </div>

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
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <Title level={5} style={{ marginBottom: 20, color: '#1f2937' }}>
                  Thống kê tổng quan
                </Title>
                <Row gutter={[20, 20]}>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      textAlign: 'center',
                      padding: '24px 20px',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderRadius: 12,
                      border: '1px solid #bae6fd',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: -10, 
                        right: -10, 
                        width: 40, 
                        height: 40, 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        borderRadius: '50%' 
                      }} />
                      <div style={{ fontSize: 13, color: '#0369a1', marginBottom: 8, fontWeight: 500 }}>Tổng số buồng</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#1e40af' }}>
                        {subRooms.length}
                      </div>
                    </div>
                  </Col>
                  
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      textAlign: 'center',
                      padding: '24px 20px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius: 12,
                      border: '1px solid #bbf7d0',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: -10, 
                        right: -10, 
                        width: 40, 
                        height: 40, 
                        background: 'rgba(34, 197, 94, 0.1)', 
                        borderRadius: '50%' 
                      }} />
                      <div style={{ fontSize: 13, color: '#166534', marginBottom: 8, fontWeight: 500 }}>Buồng hoạt động</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#16a34a' }}>
                        {subRooms.filter(r => r.isActive).length}
                      </div>
                    </div>
                  </Col>
                  
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      textAlign: 'center',
                      padding: '24px 20px',
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                      borderRadius: 12,
                      border: '1px solid #fecaca',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: -10, 
                        right: -10, 
                        width: 40, 
                        height: 40, 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        borderRadius: '50%' 
                      }} />
                      <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 8, fontWeight: 500 }}>Buồng ngưng hoạt động</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#dc2626' }}>
                        {subRooms.filter(r => !r.isActive).length}
                      </div>
                    </div>
                  </Col>
                  
                </Row>
              </div>

              {/* Danh sách buồng khám */}
              <Title level={5} style={{ marginBottom: 16, color: '#1f2937' }}>
                Danh sách buồng khám
              </Title>

              {/* Filter và Search */}
              <div style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12}>
                    <Input
                      placeholder="Tìm kiếm theo tên buồng..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      allowClear
                      style={{ borderRadius: 8, width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>

              {/* Tabs */}
              <Tabs 
                activeKey={activeTab} 
                onChange={(key) => setActiveTab(key)}
                style={{ marginBottom: 16 }}
              >
                <Tabs.TabPane tab="Hoạt động" key="active" />
                <Tabs.TabPane tab="Không hoạt động" key="inactive" />
              </Tabs>

              {/* Table */}
              <Table
                columns={columns}
                dataSource={filteredSubRooms}
                rowKey="_id"
                loading={loading}
                scroll={{ x: 'max-content' }}
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
                borderBottom: '1px solid #e5e7eb'
              }}>
                <Title level={5} style={{ margin: 0, color: '#1f2937' }}>
                  Thông tin phòng khám
                </Title>
                <Text style={{ color: '#6b7280', fontSize: 13 }}>
                  Phòng không chia buồng - Cấu hình chung
                </Text>
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
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    height: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Nha sĩ tối đa</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#1f2937' }}>
                      {room.maxDoctors}
                    </div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    height: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Y tá tối đa</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#1f2937' }}>
                      {room.maxNurses}
                    </div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    height: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Tự động lịch</div>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: '#1f2937'
                    }}>
                      {room.autoScheduleEnabled ? 'Đang bật' : 'Đang tắt'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Info Note */}
              <div style={{ 
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e5e7eb'
              }}>
                <Text style={{ color: '#6b7280', fontSize: 13 }}>
                  <strong>Lưu ý:</strong> Đây là phòng không chia buồng. Tất cả hoạt động diễn ra trong một không gian chung.
                </Text>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </>
  );
};

export default RoomDetailsModal;
