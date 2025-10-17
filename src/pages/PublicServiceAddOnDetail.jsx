/**
 * Trang chi tiết serviceAddOn cho khách hàng
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
  Divider,
  Space
} from 'antd';
import { 
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import smileDentalLogo from '../assets/image/smile-dental-logo.png';
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
      fetchServiceAddOnDetail();
    }
  }, [serviceName, addOnName]);

  const fetchServiceAddOnDetail = async () => {
    setLoading(true);
    try {
      // Tìm service theo tên
      const response = await servicesService.getServices(1, 100);
      const foundService = response.services?.find(s => s.name === decodeURIComponent(serviceName));
      
      if (foundService) {
        setService(foundService);
        
        // Tìm addOn theo tên
        const foundAddOn = foundService.serviceAddOns?.find(
          addon => addon.name === decodeURIComponent(addOnName)
        );
        
        if (foundAddOn) {
          setAddOn(foundAddOn);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching service add-on detail:', error);
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
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
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
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(`/services/pl/${encodeURIComponent(service?.name || '')}`)}>
          {service?.name || 'Dịch vụ'}
        </span>
      ),
    },
    {
      title: addOn?.name || 'Chi tiết',
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
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <Text type="secondary">Không tìm thấy thông tin dịch vụ</Text>
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
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/services/pl/${encodeURIComponent(service.name)}/addons`)}
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            height: '40px',
            padding: '0 16px'
          }}
        >
          Quay lại danh sách
        </Button>
      </div>

      {/* Service Name */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{
         color: '#313b79',
         fontSize: '2.4rem',
         fontStyle: 'normal',
         fontWeight: 600,
         overflow: 'hidden',
         margin: 0
        }}>{addOn.name}</h1>
      </div>

      {/* Main Content */}
      <Row gutter={[32, 32]}>
        {/* Left Column - Image */}
        <Col xs={24} lg={14}>
          <div style={{
            height: '500px',
            backgroundColor: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid #e8e8e8'
          }}>
            {addOn.imageUrl ? (
              <img 
                src={addOn.imageUrl} 
                alt={addOn.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />
            ) : (
              <img 
                src={smileDentalLogo} 
                alt="SmileDental Logo"
                style={{
                  width: '200px',
                  height: '200px',
                  objectFit: 'contain',
                  opacity: 0.7
                }}
              />
            )}
          </div>
        </Col>

        {/* Right Column - Service Info */}
        <Col xs={24} lg={10}>
          <div style={{ padding: '0 16px' }}>
            {/* Price Box */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e8e8e8',
              borderRadius: '12px',
              padding: '10px',
              marginBottom: '24px',
              position: 'relative'
            }}>
              {/* Orange Banner */}
              <div style={{
                backgroundColor: '#ff6b35',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'inline-block',
                marginBottom: '16px'
              }}>
                Giá dịch vụ
              </div>
              
              {/* Price */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{ 
                  color: '#313B79',
                  fontSize: '20px',
                  fontWeight: 600,
                  lineHeight: '28px'
                }}>
                  {formatPrice(addOn.price || 0)}
                </span>
              </div>
              
            </div>

            {/* Service Details */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <Text style={{ color: '#262626', fontSize: '16px', fontWeight: 'bold' }}>
                  Đơn vị: <Text style={{ color: '#666', fontWeight: 'normal' }}>{addOn.unit || 'N/A'}</Text>
                </Text>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <Text style={{ color: '#262626', fontSize: '16px', fontWeight: 'bold' }}>
                  Thời gian: <Text style={{ color: '#666', fontWeight: 'normal' }}>{addOn.durationMinutes || 0} phút</Text>
                </Text>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <Text style={{ color: '#262626', fontSize: '16px', fontWeight: 'bold' }}>
                  Loại dịch vụ: <Text style={{ color: '#666', fontWeight: 'normal' }}>{translateServiceType(service.type)}</Text>
                </Text>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <Text style={{ color: '#262626', fontSize: '16px', fontWeight: 'bold' }}>
                  Yêu cầu khám trước: <Text style={{ color: '#666', fontWeight: 'normal' }}>{service.requireExamFirst ? 'Cần khám trước' : 'Không cần khám trước'}</Text>
                </Text>
              </div>
              
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Book Button */}
              <Button
                size="large"
                style={{
                  width: '100%',
                  height: '60px',
                  borderRadius: '12px',
                  background: 'linear-gradient(90deg, rgb(49, 59, 121) 0%, rgb(69, 79, 141) 50%, rgb(49, 59, 121) 100%)',
                  backgroundSize: '300% 100%',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(49, 59, 121, 0.4)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: '20px 32px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px) scale(1.02)';
                  e.target.style.boxShadow = '0 12px 30px rgba(49, 59, 121, 0.6)';
                  e.target.style.backgroundPosition = '100% 0';
                  e.target.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 6px 20px rgba(49, 59, 121, 0.4)';
                  e.target.style.backgroundPosition = '0% 0';
                  e.target.style.filter = 'brightness(1)';
                }}
                onClick={(e) => {
                  // Hiệu ứng click - gradient chạy nhanh
                  e.target.style.backgroundPosition = '100% 0';
                  setTimeout(() => {
                    e.target.style.backgroundPosition = '0% 0';
                  }, 300);
                }}
              >
                <span style={{ 
                  position: 'relative', 
                  zIndex: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <CalendarOutlined />
                  Đặt lịch ngay
                </span>
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Description Section */}
      {addOn.description && (
        <div style={{ marginTop: '48px' }}>
          {/* Description Title */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '24px'
          }}>
            <div style={{
              width: '4px',
              height: '24px',
              backgroundColor: '#1890ff',
              marginRight: '12px',
              borderRadius: '2px'
            }} />
            <h2 style={{
              margin: 0,
              color: '#1890ff',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              Mô tả
            </h2>
          </div>
          
          <div 
            style={{
              fontSize: '16px',
              lineHeight: '1.8',
              color: '#262626'
            }}
            dangerouslySetInnerHTML={{
              __html: addOn.description
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PublicServiceAddOnDetail;