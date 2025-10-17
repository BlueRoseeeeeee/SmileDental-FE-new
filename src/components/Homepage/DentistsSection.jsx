/**
 * Section hiển thị đội ngũ nha sĩ
 * @author: HoTram
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Tag, Avatar, Spin, Carousel } from 'antd';
import { UserOutlined, StarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { userService } from '../../services';
import { useNavigate } from 'react-router-dom';
import smileDentalLogo from '../../assets/image/smile-dental-logo.png';

const { Title, Text, Paragraph } = Typography;

const DentistsSection = () => {
  const navigate = useNavigate();
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchDentists = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllStaff(1, 100); // Lấy nhiều hơn để có đủ nha sĩ
      
      // Lọc chỉ lấy nha sĩ (role: 'dentist') và isActive = true
      const dentistList = response.users?.filter(user => 
        (user.role === 'dentist' || user.role === 'doctor' || user.role === 'bác sĩ') &&
        user.isActive === true
      ) || [];
      
      setDentists(dentistList);
      // Set first dentist as selected by default
      if (dentistList.length > 0) {
        setSelectedDentist(dentistList[0]);
      }
    } catch (error) {
      console.error('Error fetching dentists:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleSelectDentist = (dentist) => {
    setSelectedDentist(dentist);
  };

  const handleViewDetail = (dentist) => {
    // Navigate to dentist detail page
    navigate(`/dentists/${encodeURIComponent(dentist._id)}`);
  };

  if (loading && initialLoad) {
    return (
      <div style={{ 
        padding: '80px 0',
        textAlign: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '80px 0',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Section Header */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <Title level={2} style={{ 
            color: '#313b79',
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            Đội ngũ nha sĩ chuyên nghiệp
          </Title>
          <Text style={{ 
            fontSize: '18px',
            color: '#666',
            maxWidth: '600px',
            display: 'block',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Đội ngũ nha sĩ giàu kinh nghiệm, được đào tạo chuyên sâu và luôn tận tâm với từng bệnh nhân
          </Text>
        </div>

        {/* Main Dentist Display */}
        {dentists.length > 0 && selectedDentist ? (
          <>
            {/* Featured Dentist */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px',
              marginBottom: '40px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
            }}>
              <Row gutter={[40, 40]} align="middle">
                {/* Left - Dentist Info */}
                <Col xs={24} lg={12}>
                  <div style={{ paddingRight: '20px' }}>
                    {/* Title */}
                    <div style={{ 
                      textAlign: 'center',
                      marginBottom: '30px'
                    }}>
                    </div>

                    {/* NHA SĨ Label */}
                    <div style={{ marginBottom: '16px' }}>
                      <Text style={{ 
                        color: '#262626',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        NHA SĨ
                      </Text>
                    </div>

                    {/* Dentist Name */}
                    <h1 level={1} style={{ 
                      color: ' #313b79',
                      fontWeight: 'bold',
                      margin: '0 0 30px 0',
                      textAlign: 'left'
                    }}>
                      {selectedDentist.fullName }
                    </h1>

                    {/* Dentist Details */}
                    <div style={{ marginBottom: '30px' }}>
                      {selectedDentist.education && (
                        <div style={{ marginBottom: '8px' }}>
                          <Text style={{ 
                            color: '#262626',
                            fontSize: '16px',
                            fontWeight: '500'
                          }}>
                            • {selectedDentist.education}
                          </Text>
                        </div>
                      )}
                      
                      {selectedDentist.certificate && (
                        <div style={{ marginBottom: '8px' }}>
                          <Text style={{ 
                            color: '#262626',
                            fontSize: '16px',
                            fontWeight: '500'
                          }}>
                            • Chứng chỉ hành nghề: {selectedDentist.certificate}
                          </Text>
                        </div>
                      )}

                      {selectedDentist.specialization && (
                        <div style={{ marginBottom: '8px' }}>
                          <Text style={{ 
                            color: '#262626',
                            fontSize: '16px',
                            fontWeight: '500'
                          }}>
                            • {selectedDentist.specialization}
                          </Text>
                        </div>
                      )}

                      {/* Description */}
                      {selectedDentist.description && (
                        <div style={{ marginTop: '16px' }}>
                          <Text style={{ 
                            color: '#262626',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            fontWeight: '400'
                          }}>
                            {selectedDentist.description}
                          </Text>
                        </div>
                      )}
                    </div>

                    {/* View Detail Button */}
                    <div style={{ textAlign: 'left' }}>
                      <Button
                        size="large"
                        onClick={() => handleViewDetail(selectedDentist)}
                        style={{
                          height: '48px',
                          padding: '0 32px',
                          borderRadius: '25px',
                          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                          border: 'none',
                          color: '#262626',
                          fontSize: '16px',
                          fontWeight: '600',
                          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
                        }}
                      >
                        Xem thêm
                      </Button>
                    </div>
                  </div>
                </Col>

                {/* Right - Dentist Photo */}
                <Col xs={24} lg={12}>
                  {selectedDentist.avatar && (
                    <img 
                      src={selectedDentist.avatar} 
                      alt={selectedDentist.fullName || selectedDentist.name}
                      style={{
                        width: '500px',
                        height: '300px',
                        objectFit: 'contain',
                      }}
                    />
                  )}
                </Col>
              </Row>
            </div>

            {/* Dentists Carousel */}
            {dentists.length > 1 && (
              <div style={{ position: 'relative' }}>
                {/* Gold separator line */}
                <div style={{
                  height: '2px',
                  background: 'linear-gradient(90deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                  marginBottom: '30px',
                  borderRadius: '1px'
                }} />

                <div style={{ position: 'relative' }}>
                  {/* Navigation Arrows */}
                  <div style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <LeftOutlined style={{ fontSize: '16px', color: '#666' }} />
                  </div>
                  
                  <div style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <RightOutlined style={{ fontSize: '16px', color: '#666' }} />
                  </div>

                  {/* Dentists Row */}
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    overflowX: 'auto',
                    padding: '0 20px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    {dentists.map((dentist) => (
                      <div
                        key={dentist._id}
                        onClick={() => handleSelectDentist(dentist)}
                        style={{
                          cursor: 'pointer',
                          textAlign: 'center',
                          padding: '20px',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          backgroundColor: selectedDentist._id === dentist._id ? '#e6f7ff' : 'white',
                          border: selectedDentist._id === dentist._id ? '2px solid #1890ff' : '2px solid transparent',
                          boxShadow: selectedDentist._id === dentist._id ? '0 4px 12px rgba(24, 144, 255, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                          minWidth: '180px',
                          flexShrink: 0
                        }}
                      >
                        <Avatar
                          size={80}
                          src={dentist.avatar}
                          icon={<UserOutlined />}
                          style={{
                            backgroundColor: '#1890ff',
                            border: '3px solid #f0f0f0',
                            marginBottom: '12px'
                          }}
                        />
                        <div>
                          <h3 style={{ 
                            color: ' #313b79',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            {dentist.fullName}
                          </h3>
                          <Text style={{ 
                            color: '#666',
                            fontSize: '12px'
                          }}>
                            {dentist.role === 'dentist' ? 'Nha sĩ' :  
                             dentist.role || 'Nha sĩ'}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ 
            textAlign: 'center',
            padding: '60px 0',
            color: '#999'
          }}>
            <UserOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>Chưa có thông tin nha sĩ</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DentistsSection;
