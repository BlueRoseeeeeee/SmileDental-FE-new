/**
 * Trang chỉnh sửa dịch vụ nha khoa
 * @author: HoTram  
 */
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space, 
  Spin, 
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Tag,
  Table,
  Modal,
  DatePicker,
  Popconfirm,
  Alert
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';
import TinyMCE from '../components/TinyMCE/TinyMCE';

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

const EditService = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [serviceDescription, setServiceDescription] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [roomTypes, setRoomTypes] = useState({});

  // Add-on confirmation states
  const [showToggleConfirmModal, setShowToggleConfirmModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // 🆕 Price schedule management states
  const [showPriceScheduleModal, setShowPriceScheduleModal] = useState(false);
  const [selectedAddOnForPrice, setSelectedAddOnForPrice] = useState(null);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [priceScheduleForm] = Form.useForm();
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [dateAnalysis, setDateAnalysis] = useState(null);


  // Auto-save key for localStorage
  const AUTO_SAVE_KEY = `service_draft_${serviceId}`;

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
      fetchRoomTypes();
    }
  }, [serviceId]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasUnsavedChanges, serviceDescription, form.getFieldsValue()]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời khỏi trang?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching service details for ID:', serviceId);
      const response = await servicesService.getServiceById(serviceId);
      console.log('Service response:', response);
      setService(response);
      
      // Load draft if exists
      const draft = loadDraft();
      if (draft) {
        form.setFieldsValue(draft.formData);
        setServiceDescription(draft.description);
        setHasUnsavedChanges(true);
        message.info('Đã khôi phục bản nháp chưa lưu');
      } else {
        form.setFieldsValue({
          name: response.name,
          type: response.type,
          requireExamFirst: response.requireExamFirst,
          allowedRoomTypes: response.allowedRoomTypes || []
        });
        setServiceDescription(response.description || '');
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      toastService.error('Không thể tải chi tiết dịch vụ: ' + error.message);
      navigate('/dashboard/services');
    } finally {
      setLoading(false);
    }
  };

  // Fetch room types
  const fetchRoomTypes = async () => {
    try {
      const response = await servicesService.getRoomTypes();
      setRoomTypes(response);
    } catch (error) {
      console.error('Error fetching room types:', error);
      toastService.error('Không thể tải danh sách loại phòng');
    }
  };

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      const formData = form.getFieldsValue();
      const draft = {
        formData,
        description: serviceDescription,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(AUTO_SAVE_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem(AUTO_SAVE_KEY);
  };

  // Handle form field changes
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  // Handle description change
  const handleDescriptionChange = (value) => {
    setServiceDescription(value);
    setHasUnsavedChanges(true);
  };

  // Handle save service
  const handleSaveService = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const updateData = {
        name: values.name,
        type: values.type,
        description: serviceDescription,
        requireExamFirst: values.requireExamFirst,
        allowedRoomTypes: values.allowedRoomTypes
      };

      const updatedService = await servicesService.updateService(serviceId, updateData);
      setService(updatedService);
      setHasUnsavedChanges(false);
      clearDraft();
      setLastSaved(new Date());
      toastService.success('Cập nhật dịch vụ thành công!');
    } catch (error) {
      toastService.error('Lỗi khi cập nhật dịch vụ');
    } finally {
      setSaving(false);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời khỏi trang?');
      if (!confirmed) return;
    }
    navigate('/dashboard/services');
  };

  // Handle delete add-on
  const handleDeleteAddOn = async (addon) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa tùy chọn "${addon.name}"?`);
    if (!confirmed) return;

    try {
      await servicesService.deleteServiceAddOn(serviceId, addon._id);
      toastService.success('Xóa tùy chọn dịch vụ thành công!');
      // Reload service details
      await fetchServiceDetails();
    } catch (error) {
      toastService.error('Lỗi khi xóa tùy chọn dịch vụ');
    }
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

  // 🆕 ========== PRICE SCHEDULE HANDLERS ==========
  
  // Helper function to analyze price schedules and find available date ranges
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

    // Gap 1: From tomorrow to before first schedule (only if it's a valid future gap)
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

    // Gaps between schedules (only real gaps, not continuous schedules)
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

    // Gap after last schedule (unlimited) - always available
    const lastSchedule = activeSchedules[activeSchedules.length - 1];
    const lastEnd = dayjs(lastSchedule.endDate);
    const afterLastGapStart = lastEnd.add(1, 'day');
    
    gaps.push({
      start: afterLastGapStart,
      end: null, // No end limit
      days: Infinity
    });

    // Smart suggested start date: 
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

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  // Open price schedule management modal
  const handleManagePriceSchedule = (addOn) => {
    setSelectedAddOnForPrice(addOn);
    setShowPriceScheduleModal(true);
  };

  // Add new price schedule
  const handleAddPriceSchedule = () => {
    priceScheduleForm.resetFields();
    setEditingSchedule(null);
    
    // Analyze existing schedules to determine available dates
    const analysis = analyzePriceSchedules(selectedAddOnForPrice?.priceSchedules || []);
    setDateAnalysis(analysis);
    
    // Set suggested start date AND update selectedStartDate state
    setSelectedStartDate(analysis.suggestedStartDate);
    priceScheduleForm.setFieldsValue({
      startDate: analysis.suggestedStartDate
    });
    
    setShowAddScheduleModal(true);
  };

  // Edit price schedule
  const handleEditPriceSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setSelectedStartDate(schedule.startDate ? dayjs(schedule.startDate) : null);
    
    // Analyze with current schedule excluded
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
      
      // Update selectedAddOnForPrice with fresh data
      const updatedService = await servicesService.getServiceById(serviceId);
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
      
      // Refresh service data and update selectedAddOnForPrice
      await fetchServiceDetails();
      
      const updatedService = await servicesService.getServiceById(serviceId);
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
      
      const updatedService = await servicesService.getServiceById(serviceId);
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
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
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
          onClick={handleGoBack}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16
        }}>
          <Title level={2} style={{ margin: 0 }}>
            Chỉnh sửa dịch vụ
          </Title>
          
          <Space>
            {lastSaved && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Lưu lần cuối: {lastSaved.toLocaleTimeString()}
              </Text>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveService}
              loading={saving}
              disabled={!hasUnsavedChanges}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Space>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          initialValues={{
            name: service?.name,
            type: service?.type,
            requireExamFirst: service?.requireExamFirst,
            allowedRoomTypes: service?.allowedRoomTypes || []
          }}
        >
          <Row gutter={[16, 16]}>
            {/* Row 1: Tên dịch vụ + Loại dịch vụ */}
            <Col span={12}>
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
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Row 2: Yêu cầu khám trước - Full width */}
            <Col span={24}>
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
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Row 3: Loại phòng cho phép - Full width */}
            <Col span={24}>
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
                  maxTagCount="responsive"
                  showSearch
                  filterOption={(input, option) =>
                    option?.children?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {Object.values(roomTypes).map((value) => (
                    <Select.Option key={value} value={value}>
                      {getRoomTypeLabel(value)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Row 4: Mô tả - Full width */}
            <Col span={24}>
              <Form.Item
                label="Mô tả"
              >
                <TinyMCE
                  value={serviceDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Nhập mô tả dịch vụ (tùy chọn)..."
                  containerStyle={{ 
                    width: '100%',
                    height: '600px'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Service Add-Ons Section */}
      <Card 
        title="Các tùy chọn dịch vụ" 
        style={{ marginTop: 24 }}
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
        {service?.serviceAddOns && service.serviceAddOns.length > 0 ? (
          <Table
            dataSource={service.serviceAddOns || []}
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
                render: (text, record) => (
                  <div>
                    <Text strong>{text}</Text>
                  </div>
                ),
              },
              {
                title: 'Giá',
                dataIndex: 'price',
                key: 'price',
                render: (price, record) => {
                  // Show effective price with promotion badge
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
                title: 'Thời gian',
                dataIndex: 'durationMinutes',
                key: 'durationMinutes',
                render: (duration) => (
                  <Text>{duration} phút</Text>
                ),
              },
              {
                title: 'Đơn vị',
                dataIndex: 'unit',
                key: 'unit',
                render: (unit) => (
                  <Tag color="blue">{unit}</Tag>
                ),
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
        {/* Show date analysis info */}
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
                      
                      // Must be after today
                      const tomorrow = dayjs().add(1, 'day').startOf('day');
                      if (value.isBefore(tomorrow, 'day')) {
                        return Promise.reject(new Error('Ngày bắt đầu phải sau ngày hôm nay ít nhất 1 ngày'));
                      }

                      // Check if date falls within existing schedule range
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
                  defaultPickerValue={dateAnalysis?.suggestedStartDate}
                  disabledDate={(current) => {
                    if (!current) return false;
                    
                    // Disable dates before tomorrow
                    const tomorrow = dayjs().add(1, 'day').startOf('day');
                    if (current.isBefore(tomorrow, 'day')) {
                      return true;
                    }

                    // Disable dates that fall within existing schedules
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

                      // Check if end date crosses into THE NEXT schedule only
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
                  defaultPickerValue={selectedStartDate}
                  disabledDate={(current) => {
                    if (!current || !selectedStartDate) return true;
                    
                    // Can select same day as start date (for single-day schedule)
                    if (current.isBefore(selectedStartDate, 'day')) {
                      return true;
                    }

                    // Find the nearest next schedule after selected start date
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

export default EditService;
