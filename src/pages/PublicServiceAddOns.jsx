/**
 * Trang hiển thị danh sách serviceAddOns của một dịch vụ cụ thể
 * @author: HoTram  
 */
import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Button, 
  Tag, 
  Breadcrumb,
  Spin,
  Empty,
  Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import smileDentalLogo from '../assets/image/smile-dental-logo.png';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService } from '../services';
import { COLOR_BRAND_NAME } from '../utils/common-colors';

const { Title, Text } = Typography;

const PublicServiceAddOns = () => {
  const navigate = useNavigate();
  const { serviceName } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Detect xem đang ở patient layout hay homepage layout
  const isPatientLayout = window.location.pathname.startsWith('/patient');

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      // Tìm service theo tên thay vì ID
      const response = await servicesService.getServices(1, 100);
      const foundService = response.services?.find(s => s.name === decodeURIComponent(serviceName));
      
      if (foundService) {
        setService(foundService);
      } else {
        navigate(isPatientLayout ? '/patient' : '/');
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      navigate(isPatientLayout ? '/patient' : '/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceName) {
      fetchServiceDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceName]);

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
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  // Xử lý click vào serviceAddOn
  const handleAddOnClick = (addOn) => {
    // Chuyển đến trang chi tiết dịch vụ với đúng layout path
    const basePath = isPatientLayout ? '/patient/services/pl' : '/services/pl';
    navigate(`${basePath}/${encodeURIComponent(service.name)}/addons/${encodeURIComponent(addOn.name)}/detail`);
  };

  // Breadcrumb items
  const breadcrumbItems = [
    {
      title: (
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(isPatientLayout ? '/patient' : '/')}>
          Trang chủ
        </span>
      ),
    },
    {
      title: (
        <span>
          Dịch vụ
        </span>
      ),
    },
    {
      title: service?.name || 'Tùy chọn dịch vụ',
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
        <Button onClick={() => navigate(isPatientLayout ? '/patient' : '/')} style={{ marginTop: 16 }}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  const activeAddOns = service.serviceAddOns?.filter(addon => addon.isActive) || [];

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

      {/* Page Title with Blue Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '32px'
      }}>
        <div style={{
          width: '4px',
          height: '40px',
          backgroundColor: '#1890ff',
          marginRight: '16px',
          borderRadius: '2px'
        }} />
        <Title level={2} style={{ 
          margin: 0, 
          color: '#262626',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          {service.name}
        </Title>
      </div>

      {/* Service AddOns Grid */}
      {activeAddOns.length > 0 ? (
        <Row gutter={[16, 16]}>
          {activeAddOns.map((addOn) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={addOn._id}>
              <Card
                hoverable
                onClick={() => handleAddOnClick(addOn)}
                style={{
                  height: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: 'white'
                }}
                bodyStyle={{ padding: '0' }}
                cover={
                  <div style={{
                    height: '200px',
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px 12px 0 0',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {addOn.imageUrl ? (
                      <img 
                        src={addOn.imageUrl} 
                        alt={addOn.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <img 
                        src={smileDentalLogo} 
                        alt="SmileDental Logo"
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'contain',
                          opacity: 0.7
                        }}
                      />
                    )}
                  </div>
                }
              >
                <div style={{ 
                  padding: '16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'space-between'
                }}>
                  {/* AddOn Name */}
                  <Tooltip 
                    title={addOn.name} 
                    placement="top"
                    overlayInnerStyle={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      maxWidth: '300px',
                      lineHeight: '1.4'
                    }}
                  >
                    <div style={{ 
                      marginTop: '-22px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      // height: '70px',
                      // maxHeight: '70px',
                      overflow: 'hidden'
                    }}>
                      <h3 
                        style={{ 
                          fontSize: '1rem',
                          color: '#313b79',
                          fontWeight: '600',
                          lineHeight: '2rem',
                          textAlign: 'center',
                          margin: 0,
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          width: '100%',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {addOn.name}
                      </h3>
                    </div>
                  </Tooltip>

                  {/* Category Tag */}
                  <div style={{ marginBottom: '8px' }}>
                    <Tag 
                      style={{ 
                        borderRadius: '12px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        backgroundColor: '#f0f0f0',
                        color: '#313b79',
                        border: 'none',
                        fontWeight: '500',
                        height: 'auto',
                        lineHeight: '1.2'
                      }}
                    >
                      {translateServiceType(service.type)}
                    </Tag>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>    
                  <h5 style={{ fontSize: 20,color: '#1D7646', fontWeight:'bold' }}>
                    {addOn.effectivePrice 
                        ? addOn.effectivePrice.toLocaleString('vi-VN')
                          : addOn.basePrice?.toLocaleString('vi-VN')} VNĐ
                   </h5>
                  </div>
                        
                   {/* View Details Button */}
                   <Button
                     type="primary"
                     style={{
                       width: '100%',
                       borderRadius: '6px',
                       height: '36px',
                       backgroundColor: '#e6f7ff',
                       borderColor: '#1890ff',
                       fontSize: '13px',
                       fontWeight: '500',
                       boxShadow: 'none',
                       marginTop: 'auto'
                     }}
                   >
                     Xem chi tiết
                   </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description="Chưa có tùy chọn dịch vụ nào"
          style={{ 
            margin: '60px 0',
            color: '#8c8c8c'
          }}
        />
      )}
    </div>
  );
};

export default PublicServiceAddOns;
