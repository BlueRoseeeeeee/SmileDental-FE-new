/**
 * ServiceDetails.jsx
 * Trang chi tiết dịch vụ nha khoa
 * @author: HoTram
 */
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Button, 
  Space, 
  Spin, 
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  DatePicker,
  Popconfirm,
  Alert
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';

const { Title, Text } = Typography;

// Helper function to get room type label
const getRoomTypeLabel = (roomType) => {
  const labels = {
    CONSULTATION: 'Phòng tư vấn/khám',
    GENERAL_TREATMENT: 'Phòng điều trị TQ',
    SURGERY: 'Phòng phẫu thuật',
    ORTHODONTIC: 'Phòng chỉnh nha',
    COSMETIC: 'Phòng thẩm mỹ',
    PEDIATRIC: 'Phòng nha nhi',
    X_RAY: 'Phòng X-quang',
    STERILIZATION: 'Phòng tiệt trùng',
    LAB: 'Phòng labo',
    RECOVERY: 'Phòng hồi sức',
    SUPPORT: 'Phòng phụ trợ'
  };
  return labels[roomType] || roomType;
};

// 🆕 Helper function to analyze price schedules and find available date ranges
const analyzePriceSchedules = (priceSchedules = [], editingScheduleId = null) => {
  // Filter out the schedule being edited (if any) and sort by startDate
  const activeSchedules = priceSchedules
    .filter(s => !editingScheduleId || s._id !== editingScheduleId)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // Get tomorrow as minimum start date
  const tomorrow = dayjs().add(1, 'day').startOf('day');

  // If no schedules exist, can start from tomorrow
  if (activeSchedules.length === 0) {
    return {
      minStartDate: tomorrow,
      suggestedStartDate: tomorrow,
      gaps: [],
      schedules: []
    };
  }

  // Find all gaps (including before first schedule and after last schedule)
  const gaps = [];
  const schedules = activeSchedules.map(s => ({
    start: dayjs(s.startDate),
    end: dayjs(s.endDate)
  }));

  // 🆕 Gap 1: From tomorrow to before first schedule (only if it's a valid future gap)
  const firstSchedule = activeSchedules[0];
  const firstStart = dayjs(firstSchedule.startDate);
  
  if (tomorrow.isBefore(firstStart, 'day')) {
    const gapDays = firstStart.diff(tomorrow, 'day');
    gaps.push({
      start: tomorrow,
      end: firstStart.subtract(1, 'day'),
      days: gapDays
    });
  }

  // 🆕 Gaps between schedules (only real gaps, not continuous schedules)
  for (let i = 0; i < activeSchedules.length - 1; i++) {
    const currentEnd = dayjs(activeSchedules[i].endDate);
    const nextStart = dayjs(activeSchedules[i + 1].startDate);
    const gapDays = nextStart.diff(currentEnd, 'day');
    
    // Only add as gap if there's at least 2 days difference (not continuous)
    if (gapDays > 1) {
      gaps.push({
        start: currentEnd.add(1, 'day'),
        end: nextStart.subtract(1, 'day'),
        days: gapDays - 1
      });
    }
  }

  // 🆕 Gap after last schedule (unlimited) - always available
  const lastSchedule = activeSchedules[activeSchedules.length - 1];
  const lastEnd = dayjs(lastSchedule.endDate);
  const afterLastGapStart = lastEnd.add(1, 'day');
  
  gaps.push({
    start: afterLastGapStart,
    end: null, // No end limit
    days: Infinity
  });

  // 🔥 Smart suggested start date: 
  // Find first gap that is actually available (start date >= tomorrow)
  let suggestedStartDate = tomorrow;
  for (const gap of gaps) {
    if (gap.start.isSameOrAfter(tomorrow, 'day')) {
      suggestedStartDate = gap.start;
      break;
    }
  }

  return {
    minStartDate: tomorrow,
    suggestedStartDate,
    gaps,
    schedules
  };
};

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState({});
  
  // Update modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [form] = Form.useForm();

  // Add-on management states
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [showEditAddOnModal, setShowEditAddOnModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [addOnForm] = Form.useForm();
  const [addOnLoading, setAddOnLoading] = useState(false);

  // Add-on confirmation states
  const [showToggleConfirmModal, setShowToggleConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 🆕 Price schedule management states
  const [showPriceScheduleModal, setShowPriceScheduleModal] = useState(false);
  const [selectedAddOnForPrice, setSelectedAddOnForPrice] = useState(null);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [priceScheduleForm] = Form.useForm();
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null); // 🆕 Track selected start date
  const [dateAnalysis, setDateAnalysis] = useState(null); // 🆕 Store analysis results

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const types = await servicesService.getRoomTypes();
        setRoomTypes(types);
      } catch (error) {
        console.error('Error fetching room types:', error);
      }
    };
    fetchRoomTypes();
  }, []);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      const response = await servicesService.getServiceById(serviceId);
      // Tương thích với cả wrapper object { success, data } và service object trực tiếp
      const serviceData = response?.data || response;
      setService(serviceData);
    } catch {
      toastService.error('Không thể tải chi tiết dịch vụ');
      navigate('/dashboard/services');
    } finally {
      setLoading(false);
    }
  };

  // Dịch loại dịch vụ sang tiếng Việt
  const translateServiceType = (type) => {
    const typeMap = {
      'treatment': 'Điều trị',
      'exam': 'Khám', 
    };
    return typeMap[type] || type;
  };

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  // Handle update service
  const handleUpdateService = () => {
    setShowUpdateModal(true);
    form.setFieldsValue({
      name: service.name,
      type: service.type,
      duration: service.durationMinutes,
      description: service.description,
      requireExamFirst: service.requireExamFirst,
      allowedRoomTypes: service.allowedRoomTypes || []
    });
  };

  // Handle confirm update
  const handleConfirmUpdate = async () => {
    try {
      setUpdateLoading(true);
      const values = await form.validateFields();
      
      const updateData = {
        name: values.name,
        type: values.type,
        duration: values.duration,
        description: values.description,
        requireExamFirst: values.requireExamFirst,
        allowedRoomTypes: values.allowedRoomTypes
      };

      const updatedService = await servicesService.updateService(serviceId, updateData);
      setService(updatedService);
      toastService.success('Cập nhật dịch vụ thành công!');
      setShowUpdateModal(false);
    } catch {
      toastService.error('Lỗi khi cập nhật dịch vụ');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle cancel update
  const handleCancelUpdate = () => {
    setShowUpdateModal(false);
    form.resetFields();
  };

  // === QL service ADD-ON  FUNCTIONS =====================================
  
  // Thêm add-on mới
  const handleAddAddOn = () => {
    setEditingAddOn(null);
    addOnForm.resetFields();
    setShowAddOnModal(true);
  };

  // Chỉnh sửa add-on
  const handleEditAddOn = (addOn) => {
    setEditingAddOn(addOn);
    addOnForm.setFieldsValue({
      name: addOn.name,
      price: addOn.price,
      description: addOn.description
    });
    setShowEditAddOnModal(true);
  };

  // Xác nhận thêm/sửa add-on
  const handleConfirmAddOn = async () => {
    try {
      setAddOnLoading(true);
      const values = await addOnForm.validateFields();
      
      if (editingAddOn) {
        // Cập nhật add-on
        await servicesService.updateServiceAddOn(serviceId, editingAddOn._id, values);
        toastService.success('Cập nhật cấp độ dịch vụ thành công!');
      } else {
        // Thêm add-on mới
        await servicesService.addServiceAddOn(serviceId, values);
        toastService.success('Thêm cấp độ dịch vụ thành công!');
      }
      
      // Reload service details
      await fetchServiceDetails();
      setShowAddOnModal(false);
      setShowEditAddOnModal(false);
      addOnForm.resetFields();
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setAddOnLoading(false);
    }
  };

  // Hủy thêm/sửa add-on
  const handleCancelAddOn = () => {
    setShowAddOnModal(false);
    setShowEditAddOnModal(false);
    setEditingAddOn(null);
    addOnForm.resetFields();
  };

  // Show toggle confirmation modal
  const handleToggleAddOn = (addOn) => {
    setSelectedAddOn(addOn);
    setShowToggleConfirmModal(true);
  };

  // Confirm toggle add-on
  const handleConfirmToggleAddOn = async () => {
    if (!selectedAddOn) return;
    
    try {
      setToggleLoading(true);
      await servicesService.toggleServiceAddOn(serviceId, selectedAddOn._id);
      toastService.success(`Đã ${selectedAddOn.isActive ? 'tắt' : 'bật'} tùy chọn dịch vụ!`);
      await fetchServiceDetails();
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setToggleLoading(false);
      setShowToggleConfirmModal(false);
      setSelectedAddOn(null);
    }
  };

  // Cancel toggle confirmation
  const handleCancelToggleAddOn = () => {
    setShowToggleConfirmModal(false);
    setSelectedAddOn(null);
  };

  // Show delete confirmation modal
  const handleDeleteAddOn = (addOn) => {
    setSelectedAddOn(addOn);
    setShowDeleteConfirmModal(true);
  };

  // Confirm delete add-on
  const handleConfirmDeleteAddOn = async () => {
    if (!selectedAddOn) return;
    
    try {
      setDeleteLoading(true);
      await servicesService.deleteServiceAddOn(serviceId, selectedAddOn._id);
      toastService.success('Xóa tùy chọn dịch vụ thành công!');
      await fetchServiceDetails();
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirmModal(false);
      setSelectedAddOn(null);
    }
  };

  // Cancel delete confirmation
  const handleCancelDeleteAddOn = () => {
    setShowDeleteConfirmModal(false);
    setSelectedAddOn(null);
  };

  // 🆕 ========== PRICE SCHEDULE HANDLERS ==========
  
  // Open price schedule management modal
  const handleManagePriceSchedule = (addOn) => {
    setSelectedAddOnForPrice(addOn);
    setShowPriceScheduleModal(true);
  };

  // Add new price schedule
  const handleAddPriceSchedule = () => {
    priceScheduleForm.resetFields();
    setEditingSchedule(null);
    
    // 🆕 Analyze existing schedules to determine available dates
    const analysis = analyzePriceSchedules(selectedAddOnForPrice?.priceSchedules || []);
    setDateAnalysis(analysis);
    
    // 🆕 Set suggested start date AND update selectedStartDate state
    setSelectedStartDate(analysis.suggestedStartDate); // ✅ Enable endDate picker
    priceScheduleForm.setFieldsValue({
      startDate: analysis.suggestedStartDate
    });
    
    setShowAddScheduleModal(true);
  };

  // Edit price schedule
  const handleEditPriceSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setSelectedStartDate(schedule.startDate ? dayjs(schedule.startDate) : null);
    
    // 🆕 Analyze with current schedule excluded
    const analysis = analyzePriceSchedules(
      selectedAddOnForPrice?.priceSchedules || [], 
      schedule._id
    );
    setDateAnalysis(analysis);
    
    priceScheduleForm.setFieldsValue({
      price: schedule.price,
      startDate: schedule.startDate ? dayjs(schedule.startDate) : null,
      endDate: schedule.endDate ? dayjs(schedule.endDate) : null,
      isActive: schedule.isActive,
      note: schedule.note
    });
    setShowEditScheduleModal(true);
  };

  // Save price schedule (add or edit)
  const handleSavePriceSchedule = async () => {
    try {
      const values = await priceScheduleForm.validateFields();
      setScheduleLoading(true);

      const scheduleData = {
        price: values.price,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
        isActive: values.isActive !== undefined ? values.isActive : true,
        note: values.note
      };

      if (editingSchedule) {
        // Update existing schedule
        await servicesService.updatePriceSchedule(
          serviceId,
          selectedAddOnForPrice._id,
          editingSchedule._id,
          scheduleData
        );
        toastService.success('Cập nhật lịch giá thành công!');
      } else {
        // Add new schedule
        await servicesService.addPriceSchedule(
          serviceId,
          selectedAddOnForPrice._id,
          scheduleData
        );
        toastService.success('Thêm lịch giá thành công!');
      }

      // Refresh service data and update selectedAddOnForPrice
      await fetchServiceDetails();
      
      //  Update selectedAddOnForPrice with fresh data
      const updatedServiceResponse = await servicesService.getServiceById(serviceId);
      //  Tương thích với cả wrapper object { success, data } và service object trực tiếp
      const updatedService = updatedServiceResponse?.data || updatedServiceResponse;
      const updatedAddOn = updatedService.serviceAddOns?.find(a => a._id === selectedAddOnForPrice._id);
      if (updatedAddOn) {
        setSelectedAddOnForPrice(updatedAddOn);
      }
      
      setShowAddScheduleModal(false);
      setShowEditScheduleModal(false);
      priceScheduleForm.resetFields();
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setScheduleLoading(false);
    }
  };

  // Delete price schedule
  const handleDeletePriceSchedule = async (schedule) => {
    try {
      await servicesService.deletePriceSchedule(
        serviceId,
        selectedAddOnForPrice._id,
        schedule._id
      );
      toastService.success('Xóa lịch giá thành công!');
      
      // 🆕 Refresh service data and update selectedAddOnForPrice
      await fetchServiceDetails();
      
      const updatedServiceResponse = await servicesService.getServiceById(serviceId);
      // Tương thích với cả wrapper object { success, data } và service object trực tiếp
      const updatedService = updatedServiceResponse?.data || updatedServiceResponse;
      const updatedAddOn = updatedService.serviceAddOns?.find(a => a._id === selectedAddOnForPrice._id);
      if (updatedAddOn) {
        setSelectedAddOnForPrice(updatedAddOn);
      }
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  // Toggle price schedule status
  const handleTogglePriceSchedule = async (schedule) => {
    try {
      await servicesService.togglePriceScheduleStatus(
        serviceId,
        selectedAddOnForPrice._id,
        schedule._id
      );
      toastService.success('Cập nhật trạng thái lịch giá thành công!');
      
      // Refresh service data and update selectedAddOnForPrice
      await fetchServiceDetails();
      
      const updatedServiceResponse = await servicesService.getServiceById(serviceId);
      //  Tương thích với cả wrapper object { success, data } và service object trực tiếp
      const updatedService = updatedServiceResponse?.data || updatedServiceResponse;
      const updatedAddOn = updatedService.serviceAddOns?.find(a => a._id === selectedAddOnForPrice._id);
      if (updatedAddOn) {
        setSelectedAddOnForPrice(updatedAddOn);
      }
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <Text type="secondary">Không tìm thấy dịch vụ</Text>
        <br />
        <Button onClick={() => navigate('/dashboard/services')} style={{ marginTop: 16 }}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/dashboard/services')}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Thông tin cơ bản */}
        <Col span={24}>
          <Card 
            title="Thông tin dịch vụ" 
            size="small"
            extra={
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/dashboard/services/${serviceId}/edit`)}
              >
                Chỉnh sửa
              </Button>
            }
          >
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <div>
                  <Text type="secondary">Tên dịch vụ:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {service.name}
                    </Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Loại dịch vụ:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue" style={{ fontSize: 14 }}>
                      {translateServiceType(service.type)}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Thời gian thực hiện ước tính:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="green" style={{ fontSize: 14 }}>
                      <ClockCircleOutlined /> {service.durationMinutes} phút
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Yêu cầu khám trước:</Text>
                  <div style={{ marginTop: 4 }}>
                    {service.requireExamFirst ? (
                      <Tag color="orange" style={{ fontSize: 14 }}>
                        <CheckCircleOutlined /> Cần khám trước
                      </Tag>
                    ) : (
                      <Tag color="green" style={{ fontSize: 14 }}>
                        <CloseCircleOutlined /> Không cần khám trước
                      </Tag>
                    )}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Trạng thái:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag style={{ fontSize: 14 }}>
                    {service.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Ngày tạo:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text>{new Date(service.createdAt).toLocaleDateString('vi-VN')}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Cập nhật lần cuối:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text>{new Date(service.updatedAt).toLocaleDateString('vi-VN')}</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Các cấp độ dịch vụ */}
        <Col span={24}>
          <Card 
            title="Các tùy chọn dịch vụ" 
            size="small"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate(`/dashboard/services/${serviceId}/addons/add`)}
                size="small"
              >
                Thêm tùy chọn
              </Button>
            }
          >
            {service.serviceAddOns && service.serviceAddOns.length > 0 ? (
              <Table
                dataSource={service.serviceAddOns}
                rowKey="_id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'STT',
                    key: 'index',
                    width: 60,
                    render: (_, __, index) => index + 1,
                  },
                  {
                    title: 'Tên tùy chọn',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text) => (
                      <div>
                        <Text strong>{text}</Text>
                      </div>
                    ),
                  },
                  {
                    title: 'Giá',
                    dataIndex: 'price',
                    key: 'price',
                    width: 200,
                    render: (price, record) => {
                      // 🆕 Show effective price with promotion badge
                      const effectivePrice = record.effectivePrice || price;
                      const isPriceModified = record.isPriceModified;
                      
                      return (
                        <div>
                          {isPriceModified ? (
                            <>
                              <div>
                                <Text 
                                  delete 
                                  type="secondary" 
                                  style={{ fontSize: 12 }}
                                >
                                  {formatPrice(record.basePrice || price)}
                                </Text>
                              </div>
                              <div>
                                <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                                  {formatPrice(effectivePrice)}
                                </Text>
                                <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>
                                  🎉 KM
                                </Tag>
                              </div>
                            </>
                          ) : (
                            <Text strong style={{ color: '#52c41a' }}>
                              {formatPrice(price)}
                            </Text>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    title: 'Trạng thái',
                    key: 'status',
                    render: (_, record) => (
                      <Tag color={record.isActive ? 'green' : 'red'}>
                        {record.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Thao tác',
                    key: 'actions',
                    width: 220,
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="text"
                          icon={<DollarOutlined />}
                          onClick={() => handleManagePriceSchedule(record)}
                          size="small"
                          title="Quản lý giá"
                        />
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/dashboard/services/${serviceId}/addons/${record._id}/edit`)}
                          size="small"
                        />
                        <Switch
                          size="small"
                          checked={record.isActive}
                          onChange={() => handleToggleAddOn(record)}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteAddOn(record)}
                          size="small"
                        />
                      </Space>
                    ),
                  },
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Chưa có tùy chọn dịch vụ</Text>
                <br />
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate(`/dashboard/services/${serviceId}/addons/add`)}
                  style={{ marginTop: 8 }}
                >
                  Thêm tùy chọn đầu tiên
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Update Service Modal */}
      <Modal
        title="Chỉnh sửa dịch vụ"
        open={showUpdateModal}
        onOk={handleConfirmUpdate}
        onCancel={handleCancelUpdate}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={updateLoading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: service?.name,
            type: service?.type,
            duration: service?.durationMinutes,
            description: service?.description,
            requireExamFirst: service?.requireExamFirst
          }}
        >
          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[
              { required: true, message: 'Vui lòng nhập tên dịch vụ' },
              { min: 2, message: 'Tên dịch vụ phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại dịch vụ"
            rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
          >
            <Select placeholder="Chọn loại dịch vụ">
              <Select.Option value="treatment">Điều trị</Select.Option>
              <Select.Option value="exam">Khám</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="duration"
            label="Thời gian thực hiện ước tính (phút)"
            rules={[
              { required: true, message: 'Vui lòng nhập thời gian' },
              { type: 'number', min: 1, message: 'Thời gian phải lớn hơn 0' }
            ]}
          >
            <InputNumber
              placeholder="Nhập thời gian"
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
              placeholder="Nhập mô tả dịch vụ (tùy chọn)"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="requireExamFirst"
            label="Yêu cầu khám trước"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Có"
              unCheckedChildren="Không"
            />
          </Form.Item>

          <Form.Item
            name="allowedRoomTypes"
            label="Loại phòng cho phép"
            rules={[
              { required: true, message: 'Vui lòng chọn ít nhất 1 loại phòng!' }
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các loại phòng có thể thực hiện dịch vụ này"
              style={{ width: '100%' }}
            >
              {Object.values(roomTypes).map((value) => (
                <Select.Option key={value} value={value}>
                  {getRoomTypeLabel(value)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Add-On Modal */}
      <Modal
        title={editingAddOn ? "Chỉnh sửa cấp độ dịch vụ" : "Thêm cấp độ dịch vụ"}
        open={showAddOnModal || showEditAddOnModal}
        onOk={handleConfirmAddOn}
        onCancel={handleCancelAddOn}
        okText={editingAddOn ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        confirmLoading={addOnLoading}
        width={600}
      >
        <Form
          form={addOnForm}
          layout="vertical"
          initialValues={{
            name: '',
            price: 0,
            description: ''
          }}
        >
          <Form.Item
            name="name"
            label="Tên cấp độ"
            rules={[
              { required: true, message: 'Vui lòng nhập tên cấp độ' },
              { min: 3, message: 'Tên cấp độ phải có ít nhất 3 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên cấp độ dịch vụ" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Giá (VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập giá' },
              { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }
            ]}
          >
            <InputNumber
              placeholder="Nhập giá dịch vụ"
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
            placeholder="Nhập mô tả cấp độ dịch vụ (tùy chọn)"
            rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Toggle Add-On Confirmation Modal */}
      <Modal
        title="Xác nhận thay đổi trạng thái tùy chọn dịch vụ"
        open={showToggleConfirmModal}
        onOk={handleConfirmToggleAddOn}
        onCancel={handleCancelToggleAddOn}
        okText={selectedAddOn?.isActive ? 'Tắt tùy chọn' : 'Bật tùy chọn'}
        cancelText="Hủy"
        okType={selectedAddOn?.isActive ? 'danger' : 'primary'}
        confirmLoading={toggleLoading}
      >
        {selectedAddOn && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: selectedAddOn.isActive ? '#ff4d4f' : '#52c41a' }}>
        {selectedAddOn.isActive ? 'TẮT' : 'BẬT'}
          </strong>
              {' '}tùy chọn dịch vụ{' '}
         <strong>"{selectedAddOn.name}"</strong>?
            </p>
            {selectedAddOn.isActive && (
              <div>
                <p style={{ color: '#faad14', fontSize: 12 }}>
                   Tùy chọn dịch vụ sẽ không còn khả dụng cho bệnh nhân đặt lịch.
                </p>
                {selectedAddOn.hasBeenUsed && (
                  <p style={{ color: '#ff4d4f', fontSize: 12 }}>
                     Tùy chọn này đã được sử dụng trong quá khứ.
                  </p>
                )}
              </div>
            )}
            {!selectedAddOn.isActive && (
              <p style={{ color: '#52c41a', fontSize: 12 }}>
                 Tùy chọn dịch vụ sẽ được kích hoạt và sẵn sàng phục vụ bệnh nhân.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Add-On Confirmation Modal */}
      <Modal
        title="Xác nhận xóa tùy chọn dịch vụ"
        open={showDeleteConfirmModal}
        onOk={handleConfirmDeleteAddOn}
        onCancel={handleCancelDeleteAddOn}
        okText="Xóa tùy chọn"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleteLoading}
      >
        {selectedAddOn && (
          <div>
            <p>
        Bạn có chắc chắn muốn{' '}
              <strong style={{ color: '#ff4d4f' }}>XÓA</strong>
              {' '}tùy chọn dịch vụ{' '}
              <strong>"{selectedAddOn.name}"</strong>?
            </p>
            
            <div style={{ backgroundColor: '#fff2f0', padding: 12, borderRadius: 6, border: '1px solid #ffccc7', marginTop: 16 }}>
              {selectedAddOn.hasBeenUsed && (
                <p style={{ color: '#ff4d4f', fontSize: 12, margin: '0 0 8px 0' }}>
                   <strong>Tùy chọn đã được sử dụng:</strong> Việc xóa có thể ảnh hưởng đến dữ liệu lịch sử và báo cáo.
                </p>
              )}
              
              <p style={{ color: '#ff4d4f', fontSize: 12, margin: 0 }}>
                 <strong>Hành động này không thể hoàn tác!</strong>
              </p>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
              Nếu bạn chỉ muốn tạm thời ngưng sử dụng tùy chọn, hãy <strong>TẮT</strong> thay vì xóa.
            </p>
          </div>
        )}
      </Modal>

      {/* 🆕 Price Schedule Management Modal */}
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
            Quản lý lịch giá - {selectedAddOnForPrice?.name || ''}
          </div>
        }
        open={showPriceScheduleModal}
        onCancel={() => setShowPriceScheduleModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowPriceScheduleModal(false)}>
            Đóng
          </Button>
        ]}
        width={900}
        style={{ top: 20 }}
      >
        {selectedAddOnForPrice && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Text strong>Giá gốc:</Text>
                <Text style={{ color: '#52c41a', fontSize: 16 }}>
                  {formatPrice(selectedAddOnForPrice.basePrice || selectedAddOnForPrice.price)}
                </Text>
                {selectedAddOnForPrice.isPriceModified && (
                  <>
                    <Text strong style={{ marginLeft: 16 }}>Giá hiệu lực:</Text>
                    <Text style={{ color: '#ff4d4f', fontSize: 16 }}>
                      {formatPrice(selectedAddOnForPrice.effectivePrice)}
                    </Text>
                    <Tag color="red">🎉 Đang khuyến mãi</Tag>
                  </>
                )}
              </Space>
            </div>

            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddPriceSchedule}
              style={{ marginBottom: 16 }}
            >
              Thêm lịch giá mới
            </Button>

            <Table
              dataSource={selectedAddOnForPrice.priceSchedules || []}
              rowKey="_id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Giá áp dụng',
                  dataIndex: 'price',
                  key: 'price',
                  render: (price) => (
                    <Text strong style={{ color: '#ff4d4f' }}>
                      {formatPrice(price)}
                    </Text>
                  )
                },
                {
                  title: 'Ngày bắt đầu',
                  dataIndex: 'startDate',
                  key: 'startDate',
                  render: (date) => dayjs(date).format('DD/MM/YYYY')
                },
                {
                  title: 'Ngày kết thúc',
                  dataIndex: 'endDate',
                  key: 'endDate',
                  render: (date) => dayjs(date).format('DD/MM/YYYY')
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'isActive',
                  key: 'isActive',
                  render: (isActive) => (
                    <Tag color={isActive ? 'green' : 'red'}>
                      {isActive ? 'Đang áp dụng' : 'Tạm ngưng'}
                    </Tag>
                  )
                },
                {
                  title: 'Ghi chú',
                  dataIndex: 'note',
                  key: 'note',
                  render: (note) => note || '-'
                },
                {
                  title: 'Thao tác',
                  key: 'actions',
                  width: 150,
                  render: (_, record) => (
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditPriceSchedule(record)}
                        size="small"
                      />
                      <Switch
                        size="small"
                        checked={record.isActive}
                        onChange={() => handleTogglePriceSchedule(record)}
                      />
                      <Popconfirm
                        title="Xác nhận xóa lịch giá?"
                        description="Hành động này không thể hoàn tác!"
                        onConfirm={() => handleDeletePriceSchedule(record)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okType="danger"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        />
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          </div>
        )}
      </Modal>

      {/* 🆕 Add/Edit Price Schedule Modal */}
      <Modal
        title={editingSchedule ? "Chỉnh sửa lịch giá" : "Thêm lịch giá mới"}
        open={showAddScheduleModal || showEditScheduleModal}
        onOk={handleSavePriceSchedule}
        onCancel={() => {
          setShowAddScheduleModal(false);
          setShowEditScheduleModal(false);
          setSelectedStartDate(null);
          setDateAnalysis(null);
          priceScheduleForm.resetFields();
        }}
        okText={editingSchedule ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        confirmLoading={scheduleLoading}
        width={700}
      >
        {/* 🆕 Show date analysis info */}
        {dateAnalysis && !editingSchedule && (
          <Alert
            type="info"
            message="Hướng dẫn chọn ngày"
            description={
              <div>
                <Text>• Ngày bắt đầu tối thiểu: <strong>{dateAnalysis.minStartDate.format('DD/MM/YYYY')}</strong></Text>
                <br />
                {dateAnalysis.gaps.length > 0 && (
                  <>
                    <Text strong style={{ color: '#52c41a' }}>• Khoảng trống có thể sử dụng:</Text>
                    <ul style={{ marginTop: 4, marginBottom: 0 }}>
                      {dateAnalysis.gaps.map((gap, idx) => (
                        <li key={idx}>
                          <Text strong>{gap.start.format('DD/MM/YYYY')}</Text>
                          {gap.end ? (
                            <>
                              {' - '}
                              <Text strong>{gap.end.format('DD/MM/YYYY')}</Text>
                              <Text type="secondary"> ({gap.days} ngày)</Text>
                            </>
                          ) : (
                            <Text type="secondary"> trở đi (không giới hạn)</Text>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {dateAnalysis.schedules.length > 0 && (
                  <>
                    <br />
                    <Text type="secondary">• Các khung giá hiện tại (không thể chọn):</Text>
                    <ul style={{ marginTop: 4, marginBottom: 0 }}>
                      {dateAnalysis.schedules.map((sch, idx) => (
                        <li key={idx}>
                          <Text type="secondary">
                            {sch.start.format('DD/MM/YYYY')} - {sch.end.format('DD/MM/YYYY')}
                          </Text>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            }
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        <Form
          form={priceScheduleForm}
          layout="vertical"
          initialValues={{
            isActive: true
          }}
        >
          <Form.Item
            name="price"
            label="Giá áp dụng (VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập giá' },
              { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }
            ]}
          >
            <InputNumber
              placeholder="Nhập giá áp dụng"
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày bắt đầu' },
                  () => ({
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      
                      // 🆕 Must be after today
                      const tomorrow = dayjs().add(1, 'day').startOf('day');
                      if (value.isBefore(tomorrow, 'day')) {
                        return Promise.reject(new Error('Ngày bắt đầu phải sau ngày hôm nay ít nhất 1 ngày'));
                      }

                      // 🆕 Check if date falls within existing schedule range
                      if (dateAnalysis?.schedules) {
                        for (const sch of dateAnalysis.schedules) {
                          if (value.isSameOrAfter(sch.start, 'day') && value.isSameOrBefore(sch.end, 'day')) {
                            return Promise.reject(
                              new Error(`Ngày này nằm trong lịch giá đã tồn tại (${sch.start.format('DD/MM/YYYY')} - ${sch.end.format('DD/MM/YYYY')})`)
                            );
                          }
                        }
                      }

                      return Promise.resolve();
                    }
                  })
                ]}
              >
                <DatePicker 
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày bắt đầu"
                  style={{ width: '100%' }}
                  defaultPickerValue={dateAnalysis?.suggestedStartDate} // 🆕 Auto open to suggested month
                  disabledDate={(current) => {
                    if (!current) return false;
                    
                    // Disable dates before tomorrow
                    const tomorrow = dayjs().add(1, 'day').startOf('day');
                    if (current.isBefore(tomorrow, 'day')) {
                      return true;
                    }

                    // 🆕 Disable dates that fall within existing schedules
                    if (dateAnalysis?.schedules) {
                      for (const sch of dateAnalysis.schedules) {
                        if (current.isSameOrAfter(sch.start, 'day') && current.isSameOrBefore(sch.end, 'day')) {
                          return true;
                        }
                      }
                    }

                    return false;
                  }}
                  onChange={(date) => {
                    setSelectedStartDate(date);
                    // Clear end date when start date changes
                    priceScheduleForm.setFieldsValue({ endDate: null });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày kết thúc' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      
                      if (!value) return Promise.resolve();
                      
                      // Must select start date first
                      if (!startDate) {
                        return Promise.reject(new Error('Vui lòng chọn ngày bắt đầu trước'));
                      }
                      
                      // End must be >= start (can be equal for single-day schedule)
                      if (value.isBefore(startDate, 'day')) {
                        return Promise.reject(new Error('Ngày kết thúc không được trước ngày bắt đầu'));
                      }

                      // 🆕 Check if end date crosses into THE NEXT schedule only
                      if (dateAnalysis?.schedules) {
                        // Find the nearest schedule AFTER selected start date
                        const nextSchedule = dateAnalysis.schedules.find(sch => 
                          sch.start.isAfter(startDate, 'day')
                        );
                        
                        if (nextSchedule) {
                          // Only check against this next schedule
                          if (value.isSameOrAfter(nextSchedule.start, 'day')) {
                            return Promise.reject(
                              new Error(`Ngày kết thúc không được chạm vào lịch giá tiếp theo (bắt đầu ${nextSchedule.start.format('DD/MM/YYYY')})`)
                            );
                          }
                        }
                        // If no next schedule, endDate can be any date after startDate
                      }

                      return Promise.resolve();
                    },
                  })
                ]}
              >
                <DatePicker 
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày kết thúc"
                  style={{ width: '100%' }}
                  disabled={!selectedStartDate}
                  defaultPickerValue={selectedStartDate} // 🆕 Auto open to selected start date's month
                  disabledDate={(current) => {
                    if (!current || !selectedStartDate) return true;
                    
                    // Can select same day as start date (for single-day schedule)
                    if (current.isBefore(selectedStartDate, 'day')) {
                      return true;
                    }

                    // 🆕 Find the nearest next schedule after selected start date
                    if (dateAnalysis?.schedules) {
                      const nextSchedule = dateAnalysis.schedules.find(sch => 
                        sch.start.isAfter(selectedStartDate, 'day')
                      );
                      
                      if (nextSchedule) {
                        // Disable dates on or after the next schedule's start
                        if (current.isSameOrAfter(nextSchedule.start, 'day')) {
                          return true;
                        }
                      }
                    }

                    return false;
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <Input.TextArea
              placeholder="Nhập ghi chú cho lịch giá (VD: Khuyến mãi Tết, Giảm giá mùa hè...)"
              rows={3}
              maxLength={500}
              showCount
              className="price-schedule-textarea"
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Đang áp dụng" 
              unCheckedChildren="Tạm ngưng" 
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceDetails;