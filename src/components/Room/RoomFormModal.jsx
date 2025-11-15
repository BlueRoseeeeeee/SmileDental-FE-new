/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Row,
  Col,
  InputNumber,
  Typography,
  Divider,
  List,
  Tag,
  Tooltip
} from 'antd';
import { toast } from '../../services/toastService';
import {
  EnvironmentOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import roomService from '../../services/roomService';

const {Text } = Typography;

// Helper function to get room type label in Vietnamese
const getRoomTypeLabel = (roomType) => {
  const labels = {
    CONSULTATION: 'Phòng tư vấn/khám tổng quát',
    GENERAL_TREATMENT: 'Phòng điều trị tổng quát',
    SURGERY: 'Phòng phẫu thuật/tiểu phẫu',
    ORTHODONTIC: 'Phòng chỉnh nha/niềng',
    COSMETIC: 'Phòng thẩm mỹ nha',
    PEDIATRIC: 'Phòng nha nhi',
    X_RAY: 'Phòng X-quang/CT',
    STERILIZATION: 'Phòng tiệt trùng',
    LAB: 'Phòng labo/kỹ thuật viên',
    RECOVERY: 'Phòng hồi sức',
    SUPPORT: 'Phòng phụ trợ/nhân viên'
  };
  return labels[roomType] || roomType;
};

const RoomFormModal = ({ visible, open, onClose, onSuccess, room }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasSubRooms, setHasSubRooms] = useState(false);
  const [subRoomTogglingMap, setSubRoomTogglingMap] = useState({});
  const [roomTypes, setRoomTypes] = useState({});
  
  // Support both visible and open props (visible is deprecated)
  const isOpen = open ?? visible;

  // Toggle confirmation modal states
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [pendingToggleValue, setPendingToggleValue] = useState(null);
  const [toggleField, setToggleField] = useState(null);
  
  // SubRoom toggle confirmation states
  const [showSubRoomToggleModal, setShowSubRoomToggleModal] = useState(false);
  const [selectedSubRoom, setSelectedSubRoom] = useState(null);
  const [pendingSubRoomToggle, setPendingSubRoomToggle] = useState(null);

  // Add/Delete SubRoom states
  const [addSubRoomCount, setAddSubRoomCount] = useState(1);
  const [isAddingSubRooms, setIsAddingSubRooms] = useState(false);
  const [showDeleteSubRoomModal, setShowDeleteSubRoomModal] = useState(false);
  const [selectedSubRoomForDelete, setSelectedSubRoomForDelete] = useState(null);
  const [deleteSubRoomLoading, setDeleteSubRoomLoading] = useState(false);

  // State để lưu room data đầy đủ khi edit
  const [fullRoomData, setFullRoomData] = useState(null);
  const [fetchingRoomData, setFetchingRoomData] = useState(false);

  // Fetch full room data khi mở modal edit
  useEffect(() => {
    const fetchRoomData = async () => {
      if (isOpen && room && room._id) {
        setFetchingRoomData(true);
        try {
          const response = await roomService.getRoomById(room._id);
          const roomData = response.room || response;
          setFullRoomData(roomData);
          
          // Set form values với dữ liệu đầy đủ
          form.setFieldsValue({
            name: roomData.name,
            roomType: roomData.roomType,
            hasSubRooms: roomData.hasSubRooms,
            subRoomCount: roomData.subRooms?.length || 1,
            maxDoctors: roomData.maxDoctors ?? 1, // 🔧 Cho phép giá trị 0
            maxNurses: roomData.maxNurses ?? 1,   // 🔧 Cho phép giá trị 0
            isActive: roomData.isActive
          });
          setHasSubRooms(roomData.hasSubRooms);
        } catch (error) {
          toast.error('Lỗi khi tải thông tin phòng: ' + error.message);
          // Fallback to room prop data
          form.setFieldsValue({
            name: room.name,
            roomType: room.roomType,
            hasSubRooms: room.hasSubRooms,
            subRoomCount: room.subRooms?.length || 1,
            maxDoctors: room.maxDoctors ?? 1, // 🔧 Cho phép giá trị 0
            maxNurses: room.maxNurses ?? 1,   // 🔧 Cho phép giá trị 0
            isActive: room.isActive
          });
          setHasSubRooms(room.hasSubRooms);
        } finally {
          setFetchingRoomData(false);
        }
      } else if (isOpen && !room) {
        // Chế độ tạo mới
        setFullRoomData(null);
        form.resetFields();
        setHasSubRooms(false);
      }
    };

    fetchRoomData();
  }, [isOpen, room, form]);

  // Fetch room types
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const types = await roomService.getRoomTypes();
        setRoomTypes(types);
      } catch (error) {
        console.error('Error fetching room types:', error);
      }
    };
    fetchRoomTypes();
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (room) {
        const updateData = {
          name: values.name,
          roomType: values.roomType,
          isActive: values.isActive
        };

        if (!room.hasSubRooms) {
          updateData.maxDoctors = values.maxDoctors;
          updateData.maxNurses = values.maxNurses;
        } else {
          // 🆕 Nếu có subrooms, kiểm tra xem tất cả subroom đã tắt chưa
          const currentRoomData = fullRoomData || room;
          if (currentRoomData.subRooms && currentRoomData.subRooms.length > 0) {
            const allSubRoomsInactive = currentRoomData.subRooms.every(sr => !sr.isActive);
            
            if (allSubRoomsInactive) {
              // Nếu tất cả subroom đã tắt, bắt buộc room cũng phải tắt
              updateData.isActive = false;
              console.log('⚠️ Tất cả subroom đã tắt → Tự động tắt room');
            }
          }
        }

        await roomService.updateRoom(room._id, updateData);
        toast.success('Cập nhật phòng khám thành công');
      } else {
        const roomData = {
          name: values.name,
          roomType: values.roomType,
          hasSubRooms: values.hasSubRooms,
          isActive: values.isActive
        };

        if (values.hasSubRooms) {
          roomData.subRoomCount = values.subRoomCount;
        } else {
          roomData.maxDoctors = values.maxDoctors;
          roomData.maxNurses = values.maxNurses;
        }

        await roomService.createRoom(roomData);
        toast.success('Tạo phòng khám thành công');
      }

      onSuccess();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
    // Refresh parent list khi đóng modal để cập nhật số liệu
    if (room) {
      onSuccess();
    }
  };

  // Handle toggle confirmation
  const handleToggleConfirmation = (field, value) => {
    setToggleField(field);
    setPendingToggleValue(value);
    setShowToggleModal(true);
  };

  // Handle confirm toggle
  const handleConfirmToggle = () => {
    if (toggleField === 'hasSubRooms') {
      setHasSubRooms(pendingToggleValue);
      form.setFieldsValue({ hasSubRooms: pendingToggleValue });
    } else if (toggleField === 'isActive') {
      form.setFieldsValue({ isActive: pendingToggleValue });
    }
    setShowToggleModal(false);
    setPendingToggleValue(null);
    setToggleField(null);
  };

  // Handle cancel toggle
  const handleCancelToggle = () => {
    setShowToggleModal(false);
    setPendingToggleValue(null);
    setToggleField(null);
  };

  // Handle SubRoom toggle confirmation
  const handleSubRoomToggleConfirmation = (subRoom) => {
    setSelectedSubRoom(subRoom);
    setPendingSubRoomToggle(!subRoom.isActive);
    setShowSubRoomToggleModal(true);
  };

  // Handle confirm SubRoom toggle
  const handleConfirmSubRoomToggle = async () => {
    if (!selectedSubRoom) return;
    
    const subRoomId = selectedSubRoom._id;
    setSubRoomTogglingMap(prev => ({ ...prev, [subRoomId]: true }));
    
    try {
      await roomService.toggleSubRoomStatus(room._id, subRoomId);
      toast.success(`Đã ${pendingSubRoomToggle ? 'kích hoạt' : 'tắt'} buồng "${selectedSubRoom.name}"`);
      
      // Fetch lại dữ liệu phòng để cập nhật UI trong modal
      const response = await roomService.getRoomById(room._id);
      const roomData = response.room || response;
      setFullRoomData(roomData);
      
      // KHÔNG gọi onSuccess() để modal không đóng
    } catch (error) {
      toast.error('Lỗi khi thay đổi trạng thái buồng: ' + error.message);
    } finally {
      setSubRoomTogglingMap(prev => ({ ...prev, [subRoomId]: false }));
      setShowSubRoomToggleModal(false);
      setSelectedSubRoom(null);
      setPendingSubRoomToggle(null);
    }
  };

  // Handle cancel SubRoom toggle
  const handleCancelSubRoomToggle = () => {
    setShowSubRoomToggleModal(false);
    setSelectedSubRoom(null);
    setPendingSubRoomToggle(null);
  };

  // Handle add SubRooms
  const handleAddSubRooms = async () => {
    if (!room || addSubRoomCount < 1) {
      toast.error('Số lượng buồng phải lớn hơn 0');
      return;
    }

    setIsAddingSubRooms(true);
    try {
      await roomService.addSubRooms(room._id, addSubRoomCount);
      toast.success(`Đã thêm ${addSubRoomCount} buồng thành công`);
      
      // Fetch lại dữ liệu phòng để cập nhật UI trong modal
      const response = await roomService.getRoomById(room._id);
      const roomData = response.room || response;
      setFullRoomData(roomData);
      
      // Reset count
      setAddSubRoomCount(1);
      
      // KHÔNG gọi onSuccess() để modal không đóng
    } catch (error) {
      toast.error('Lỗi khi thêm buồng: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsAddingSubRooms(false);
    }
  };

  // Handle delete SubRoom confirmation
  const handleDeleteSubRoomConfirmation = (subRoom) => {
    setSelectedSubRoomForDelete(subRoom);
    setShowDeleteSubRoomModal(true);
  };

  // Handle confirm delete SubRoom
  const handleConfirmDeleteSubRoom = async () => {
    if (!selectedSubRoomForDelete) return;

    setDeleteSubRoomLoading(true);
    try {
      await roomService.deleteSubRoom(room._id, selectedSubRoomForDelete._id);
      toast.success(`Đã xóa buồng "${selectedSubRoomForDelete.name}" thành công`);
      
      // Fetch lại dữ liệu phòng để cập nhật UI trong modal
      const response = await roomService.getRoomById(room._id);
      const roomData = response.room || response;
      setFullRoomData(roomData);
      
      // KHÔNG gọi onSuccess() để modal không đóng
    } catch (error) {
      toast.error('Lỗi khi xóa buồng: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteSubRoomLoading(false);
      setShowDeleteSubRoomModal(false);
      setSelectedSubRoomForDelete(null);
    }
  };

  // Handle cancel delete SubRoom
  const handleCancelDeleteSubRoom = () => {
    setShowDeleteSubRoomModal(false);
    setSelectedSubRoomForDelete(null);
  };

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#262626'
        }}>
          <EnvironmentOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          {room ? 'Chỉnh sửa phòng khám' : 'Tạo phòng khám mới'}
        </div>
      }
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          hasSubRooms: false,
          subRoomCount: 1,
          maxDoctors: 1,
          maxNurses: 1,
          isActive: true
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Tên phòng khám"
              rules={[
                { required: true, message: 'Vui lòng nhập tên phòng khám' },
                { min: 2, message: 'Tên phòng khám phải có ít nhất 2 ký tự' }
              ]}
            >
              <Input
                placeholder="Nhập tên phòng khám"
                prefix={<EnvironmentOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="roomType"
              label="Loại phòng"
              rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
            >
              <Select 
                placeholder="Chọn loại phòng"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {Object.entries(roomTypes).map(([key, value]) => (
                  <Select.Option key={value} value={value}>
                    {getRoomTypeLabel(value)}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="hasSubRooms"
              label="Cấu trúc phòng"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Có buồng"
                unCheckedChildren="Không buồng"
                onChange={(value) => {
                  if (!room) { // Chỉ show confirm khi tạo mới
                    handleToggleConfirmation('hasSubRooms', value);
                  }
                }}
                disabled={!!room} // Không thể thay đổi loại phòng khi edit
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="isActive"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Hoạt động"
                unCheckedChildren="Không hoạt động"
                onChange={(value) => handleToggleConfirmation('isActive', value)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {hasSubRooms ? (
          room ? (
            // Khi edit phòng có subrooms - Hiển thị danh sách buồng với toggle, thêm, xóa
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong>
                  <HomeOutlined style={{ marginRight: 8 }} />
                  Danh sách buồng ({fullRoomData?.subRooms?.length || room.subRooms?.length || 0} buồng)
                </Text>
              </div>

              {fetchingRoomData ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Đang tải dữ liệu...</Text>
                </div>
              ) : (
                <>
                  <List
                    size="small"
                    bordered
                    dataSource={fullRoomData?.subRooms || room.subRooms || []}
                    renderItem={(subRoom) => (
                      <List.Item
                        actions={[
                          <Tooltip title={subRoom.isActive ? 'Tắt buồng' : 'Bật buồng'}>
                            <Switch
                              size="small"
                              checked={subRoom.isActive}
                              loading={subRoomTogglingMap[subRoom._id]}
                              onChange={() => handleSubRoomToggleConfirmation(subRoom)}
                              checkedChildren="Bật"
                              unCheckedChildren="Tắt"
                            />
                          </Tooltip>,
                          <Tooltip title={subRoom.hasBeenUsed ? 'Không thể xóa buồng đã sử dụng' : 'Xóa buồng'}>
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteSubRoomConfirmation(subRoom)}
                              disabled={subRoom.hasBeenUsed}
                            />
                          </Tooltip>
                        ]}
                      >
                        <Space>
                          <Text>{subRoom.name}</Text>
                          <Tag 
                            color={subRoom.isActive ? 'green' : 'red'} 
                            icon={subRoom.isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                          >
                            {subRoom.isActive ? 'Hoạt động' : 'Tắt'}
                          </Tag>
                          {subRoom.hasBeenUsed && (
                            <Tag color="orange" size="small">Đã sử dụng</Tag>
                          )}
                        </Space>
                      </List.Item>
                    )}
                    style={{ maxHeight: 300, overflow: 'auto' }}
                  />

                  {/* Add SubRooms Section */}
                  <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      <PlusOutlined style={{ marginRight: 8 }} />
                      Thêm buồng mới
                    </Text>
                    <Space>
                      <InputNumber
                        min={1}
                        max={10}
                        value={addSubRoomCount}
                        onChange={setAddSubRoomCount}
                        placeholder="Số lượng"
                        style={{ width: 120 }}
                      />
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddSubRooms}
                        loading={isAddingSubRooms}
                      >
                        Thêm {addSubRoomCount} buồng
                      </Button>
                    </Space>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                      Buồng mới sẽ được đánh số tự động tiếp theo buồng cuối cùng
                    </Text>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Khi tạo mới phòng có subrooms
            <Form.Item
              name="subRoomCount"
              label="Số lượng buồng ban đầu"
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng buồng' },
                { type: 'number', min: 1, message: 'Số lượng buồng phải lớn hơn 0' }
              ]}
            >
              <InputNumber
                min={1}
                max={20}
                style={{ width: '100%' }}
                placeholder="Nhập số lượng buồng"
              />
            </Form.Item>
          )
        ) : (
          // Phòng không có subrooms - Hiển thị maxDoctors/maxNurses
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxDoctors"
                label="Số nha sĩ tối đa"
                dependencies={['maxNurses']} // 🔧 Trigger validation khi maxNurses thay đổi
                rules={[
                  { required: true, message: 'Vui lòng nhập số nha sĩ tối đa' },
                  { type: 'number', min: 0, message: 'Số nha sĩ phải từ 0 trở lên' },
                  // 🔧 Custom validator: Ít nhất 1 người (nha sĩ hoặc y tá)
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxNurses = getFieldValue('maxNurses') || 0;
                      const maxDoctors = value || 0;
                      if (maxDoctors + maxNurses >= 1) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Phòng phải có ít nhất 1 nha sĩ hoặc 1 y tá'));
                    },
                  })
                ]}
              >
                <InputNumber
                  min={0}
                  max={10}
                  style={{ width: '100%' }}
                  placeholder="Nhập số nha sĩ"
                  parser={value => value.replace(/\D/g, '')} // 🔧 Chặn ký tự không phải số
                  formatter={value => value} // Hiển thị số nguyên
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxNurses"
                label="Số y tá tối đa"
                dependencies={['maxDoctors']} // 🔧 Trigger validation khi maxDoctors thay đổi
                rules={[
                  { required: true, message: 'Vui lòng nhập số y tá tối đa' },
                  { type: 'number', min: 0, message: 'Số y tá phải từ 0 trở lên' },
                  // 🔧 Custom validator: Ít nhất 1 người (nha sĩ hoặc y tá)
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxDoctors = getFieldValue('maxDoctors') || 0;
                      const maxNurses = value || 0;
                      if (maxDoctors + maxNurses >= 1) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Phòng phải có ít nhất 1 nha sĩ hoặc 1 y tá'));
                    },
                  })
                ]}
              >
                <InputNumber
                  min={0}
                  max={10}
                  style={{ width: '100%' }}
                  placeholder="Nhập số y tá"
                  parser={value => value.replace(/\D/g, '')} // 🔧 Chặn ký tự không phải số
                  formatter={value => value} // Hiển thị số nguyên
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Divider />

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {room ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Toggle Confirmation Modal */}
      <Modal
        title="Xác nhận thay đổi"
        open={showToggleModal}
        onOk={handleConfirmToggle}
        onCancel={handleCancelToggle}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        centered
        width={480}
      >
        {toggleField && (
          <div>
            {toggleField === 'hasSubRooms' && (
              <div>
                <p>
                  Bạn có chắc chắn muốn thay đổi loại phòng thành{' '}
                  <strong style={{ color: pendingToggleValue ? '#1890ff' : '#52c41a' }}>
                    {pendingToggleValue ? 'Có buồng' : 'Không buồng'}
                  </strong>?
                </p>
                
                {pendingToggleValue && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#e6f7ff', 
                    borderLeft: '4px solid #1890ff',
                    borderRadius: '4px',
                    marginTop: '12px'
                  }}>
                    <p style={{ margin: 0, color: '#096dd9', fontSize: '12px' }}>
                       Phòng có buồng sẽ được tạo với số lượng buồng bạn chỉ định.
                    </p>
                  </div>
                )}
                
                {!pendingToggleValue && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f6ffed', 
                    borderLeft: '4px solid #52c41a',
                    borderRadius: '4px',
                    marginTop: '12px'
                  }}>
                    <p style={{ margin: 0, color: '#389e0d', fontSize: '12px' }}>
                       Phòng không buồng sẽ có thông số về số lượng nha sĩ và y tá tối đa.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {toggleField === 'isActive' && (
              <div>
                <p>
                  Bạn có chắc chắn muốn{' '}
                  <strong style={{ color: pendingToggleValue ? '#52c41a' : '#ff4d4f' }}>
                    {pendingToggleValue ? 'KÍCH HOẠT' : 'TẮT'}
                  </strong>
                  {' '}phòng khám này?
                </p>
                
                {pendingToggleValue && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f6ffed', 
                    borderLeft: '4px solid #52c41a',
                    borderRadius: '4px',
                    marginTop: '12px'
                  }}>
                    <p style={{ margin: 0, color: '#389e0d', fontSize: '12px' }}>
                       Phòng sẽ được kích hoạt và sẵn sàng phục vụ bệnh nhân.
                    </p>
                  </div>
                )}
                
                {!pendingToggleValue && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#fff2e8', 
                    borderLeft: '4px solid #ff7a00',
                    borderRadius: '4px',
                    marginTop: '12px'
                  }}>
                    <p style={{ margin: 0, color: '#d46b08', fontSize: '12px' }}>
                       Phòng sẽ không còn khả dụng cho việc đặt lịch và sắp xếp bệnh nhân.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* SubRoom Toggle Confirmation Modal */}
      <Modal
        title="Xác nhận thay đổi trạng thái buồng"
        open={showSubRoomToggleModal}
        onOk={handleConfirmSubRoomToggle}
        onCancel={handleCancelSubRoomToggle}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        centered
        width={480}
        confirmLoading={selectedSubRoom && subRoomTogglingMap[selectedSubRoom._id]}
      >
        {selectedSubRoom && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: pendingSubRoomToggle ? '#52c41a' : '#ff4d4f' }}>
                {pendingSubRoomToggle ? 'KÍCH HOẠT' : 'TẮT'}
              </strong>
              {' '}buồng <strong>{selectedSubRoom.name}</strong>?
            </p>
            
            {pendingSubRoomToggle && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f6ffed', 
                borderLeft: '4px solid #52c41a',
                borderRadius: '4px',
                marginTop: '12px'
              }}>
                <p style={{ margin: 0, color: '#389e0d', fontSize: '12px' }}>
                   Buồng sẽ được kích hoạt và sẵn sàng cho việc tạo lịch và phục vụ bệnh nhân.
                </p>
              </div>
            )}
            
            {!pendingSubRoomToggle && (
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
          </div>
        )}
      </Modal>

      {/* Delete SubRoom Confirmation Modal */}
      <Modal
        title="Xác nhận xóa buồng"
        open={showDeleteSubRoomModal}
        onOk={handleConfirmDeleteSubRoom}
        onCancel={handleCancelDeleteSubRoom}
        okText="Xóa buồng"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleteSubRoomLoading}
        centered
        width={480}
      >
        {selectedSubRoomForDelete && (
          <div>
            <p>
              Bạn có chắc chắn muốn xóa buồng{' '}
              <strong style={{ color: '#ff4d4f' }}>
                {selectedSubRoomForDelete.name}
              </strong>?
            </p>
            
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#fff1f0', 
              borderLeft: '4px solid #ff4d4f',
              borderRadius: '4px',
              marginTop: '12px'
            }}>
              <p style={{ margin: 0, color: '#cf1322', fontSize: '12px' }}>
                ⚠️ <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Buồng sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            {selectedSubRoomForDelete.hasBeenUsed && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fffbe6', 
                borderLeft: '4px solid #faad14',
                borderRadius: '4px',
                marginTop: '12px'
              }}>
                <p style={{ margin: 0, color: '#d48806', fontSize: '12px' }}>
                  ⚠️ Buồng này đã được sử dụng trong hệ thống và không thể xóa.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Modal>
  );
};

export default RoomFormModal;
