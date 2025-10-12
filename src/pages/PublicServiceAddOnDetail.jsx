/**
 * PublicServiceAddOnDetail.jsx
 * Trang chi tiết dịch vụ con (serviceAddOn)
 * @author: HoTram  
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Tag, 
  Breadcrumb,
  Spin,
  Divider,
  Space
} from 'antd';
import { 
  ArrowLeftOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService } from '../services';

const { Title, Text, Paragraph } = Typography;

const PublicServiceAddOnDetail = () => {
  const navigate = useNavigate();
  const { serviceName, addOnName } = useParams();
  const [service, setService] = useState(null);
  const [addOn, setAddOn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceName && addOnName) {
      fetchServiceDetails();
    }
  }, [serviceName, addOnName]);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      // Tìm service theo tên để lấy ID
      const servicesResponse = await servicesService.getServices(1, 100);
      const foundService = servicesResponse.services?.find(s => s.name === decodeURIComponent(serviceName));
      
      if (foundService) {
        setService(foundService);
        
        // Tìm addOn theo tên để lấy ID
        const foundAddOn = foundService.serviceAddOns?.find(a => a.name === decodeURIComponent(addOnName));
        if (foundAddOn) {
          // Sử dụng API chi tiết để lấy thông tin addOn
          const addOnResponse = await servicesService.getServiceAddOnById(foundService._id, foundAddOn._id);
          setAddOn(addOnResponse.addOn);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      navigate('/');
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
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  // Breadcrumb items
  const breadcrumbItems = [
    {
      title: (
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate('/')}>
          Trang chủ
        </span>
      ),
    },
    {
      title: (
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate('/')}>
          Dịch vụ
        </span>
      ),
    },
    {
      title: (
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(`/services/pl/${encodeURIComponent(service?.name || '')}/addons`)}>
          {service?.name || 'Dịch vụ'}
        </span>
      ),
    },
    {
      title: addOn?.name || 'Chi tiết dịch vụ',
    },
  ];

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

  if (!service || !addOn) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: 'white',
        minHeight: '100vh'
      }}>
        <Text type="secondary">Không tìm thấy dịch vụ</Text>
        <br />
        <Button onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: 'white', 
      minHeight: '100vh',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Breadcrumb */}
      <Breadcrumb 
        items={breadcrumbItems}
        style={{ marginBottom: '24px' }}
      />

      {/* Back Button */}
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(`/services/pl/${encodeURIComponent(service.name)}/addons`)}
        style={{ marginBottom: 24 }}
      >
        Quay lại danh sách
      </Button>

      <Row gutter={[32, 32]} align="stretch">
        {/* Service Image */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ 
              padding: '20px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{
              height: '100%',
              backgroundColor: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}>
              <MedicineBoxOutlined 
                style={{ 
                  fontSize: '80px', 
                  color: '#d9d9d9',
                  opacity: 0.6
                }} 
              />
            </div>
          </Card>
        </Col>

        {/* Service Information */}
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ 
              padding: '24px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ flex: 1 }}>
              {/* Service Name */}
              <Title level={2} style={{ 
                marginBottom: '16px',
                color: '#262626'
              }}>
                {addOn.name}
              </Title>

              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <Text style={{ 
                  color: '#52c41a', 
                  fontSize: '28px',
                  fontWeight: 'bold'
                }}>
                  {formatPrice(addOn.price)}
                </Text>
              </div>

              {/* Service Details */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={12}>
                  <div>
                    <Text type="secondary">Thời gian thực hiện:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="blue" style={{ fontSize: 14 }}>
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
              </Row>
            </div>

            <div>
              <Divider />

              {/* Action Button */}
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                style={{
                  height: '48px',
                  padding: '0 32px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  fontWeight: '600',
                  width: '100%'
                }}
                onClick={() => {
                  // Có thể chuyển đến trang đặt lịch
                  console.log('Book appointment for:', addOn.name);
                }}
              >
                Đặt lịch ngay
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Service Description Section */}
      {addOn.description && (
        <Card
          style={{
            marginTop: '32px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: 'none'
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <div 
            style={{ 
              color: '#666',
              lineHeight: '1.6',
              fontSize: '16px'
            }}
            dangerouslySetInnerHTML={{ __html: addOn.description }}
          />
        </Card>
      )}
    </div>
  );
};

export default PublicServiceAddOnDetail;
