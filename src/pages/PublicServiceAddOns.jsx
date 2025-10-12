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
  Empty
} from 'antd';
import { 
  ArrowLeftOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService } from '../services';

const { Title, Text } = Typography;

const PublicServiceAddOns = () => {
  const navigate = useNavigate();
  const { serviceName } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceName) {
      fetchServiceDetails();
    }
  }, [serviceName]);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      // Tìm service theo tên thay vì ID
      const response = await servicesService.getServices(1, 100);
      const foundService = response.services?.find(s => s.name === decodeURIComponent(serviceName));
      
      if (foundService) {
        setService(foundService);
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

  // Xử lý click vào serviceAddOn
  const handleAddOnClick = (addOn) => {
    // Có thể mở modal chi tiết hoặc chuyển đến trang đặt lịch
    console.log('Selected addon:', addOn);
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
        <Button onClick={() => navigate('/')} style={{ marginTop: 16 }}>
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
        <Row gutter={[24, 24]}>
          {activeAddOns.map((addOn) => (
            <Col xs={24} sm={12} lg={6} xl={6} key={addOn._id}>
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
                    height: '240px',
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px 12px 0 0',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <MedicineBoxOutlined 
                      style={{ 
                        fontSize: '80px', 
                        color: '#d9d9d9',
                        opacity: 0.6
                      }} 
                    />
                  </div>
                }
              >
                <div style={{ 
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  {/* AddOn Name */}
                  <Title 
                    level={4} 
                    style={{ 
                      marginBottom: '12px',
                      color: '#1a1a1a',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      lineHeight: '1.4',
                      height: '44px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      textAlign: 'center',
                      margin: '0 0 12px 0'
                    }}
                  >
                    {addOn.name}
                  </Title>

                  {/* Category Tag */}
                  <div style={{ marginBottom: '16px' }}>
                    <Tag 
                      style={{ 
                        borderRadius: '16px',
                        padding: '6px 16px',
                        fontSize: '12px',
                        backgroundColor: '#f5f5f5',
                        color: '#666',
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
                  <div style={{ marginBottom: '20px' }}>
                    <Text style={{ 
                      color: '#52c41a', 
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {formatPrice(addOn.price)}
                    </Text>
                  </div>

                   {/* View Details Button */}
                   <Button
                     type="primary"
                     style={{
                       width: '100%',
                       borderRadius: '8px',
                       height: '36px',
                       backgroundColor: '#1890ff',
                       borderColor: '#1890ff',
                       color: 'white',
                       fontSize: '13px',
                       fontWeight: '500',
                       boxShadow: 'none'
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
