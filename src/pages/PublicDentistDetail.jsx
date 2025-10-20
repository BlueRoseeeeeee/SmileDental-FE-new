/**
 * Trang chi tiết nha sĩ công khai- hiển thị cho tất cả người dùng
 * @author: HoTram
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Typography, 
  Spin, 
  Empty
} from 'antd';
import { 
  UserOutlined, 
} from '@ant-design/icons';
import { userService } from '../services';

const { Text } = Typography;

const PublicDentistDetail = () => {
  const { id } = useParams();
  const [dentist, setDentist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDentistDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDentistDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUserById(id);
      
      if (response.success && response.user) {
        setDentist(response.user);
      } else {
        setError('Không tìm thấy thông tin nha sĩ');
      }
    } catch (error) {
      console.error('Error fetching dentist detail:', error);
      setError('Có lỗi xảy ra khi tải thông tin nha sĩ');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', fontSize: '18px', color: '#666' }}>
            Đang tải thông tin nha sĩ...
          </div>
        </div>
      </div>
    );
  }

  if (error || !dentist) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        backgroundColor: '#f8f9fa',
        padding: '20px'
      }}>
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '400px', 
          width: '100%',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <Empty 
            description={error || 'Không tìm thấy thông tin nha sĩ'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Div trên: Hình ảnh và Chuyên môn */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '60px 40px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}>
          <Row gutter={[60, 40]} align="top">
            {/* Cột trái - Hình ảnh và thông tin cơ bản */}
            <Col xs={24} lg={10}>
              <div style={{ textAlign: 'center' }}>
                {dentist.avatar ? (
                  <img
                    src={dentist.avatar}
                    alt={dentist.fullName}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: '400px',
                      objectFit: 'cover',
                      marginBottom: '24px',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: '400px',
                      borderRadius: '16px',
                      backgroundColor: '#313b79',
                      marginBottom: '24px',
                      boxShadow: '0 8px 32px rgba(49, 59, 121, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px auto'
                    }}
                  >
                    <UserOutlined style={{ fontSize: '80px', color: 'white' }} />
                  </div>
                )}
               
              </div>
            </Col>

            {/* Cột phải - Chuyên môn & Kinh nghiệm */}
            <Col xs={24} lg={14}>
              <div>
                <h2 style={{ 
                  color: 'rgb(49, 59, 121)',
                  fontSize: '28px',
                  fontWeight:'bold'
                }}>
                  Nha sĩ. {dentist.fullName}
                </h2>
                {dentist.description && (
                  <div 
                    style={{ 
                      fontSize: '16px',
                      lineHeight: '1.8',
                      padding: '16px',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: dentist.description
                    }}
                  />
                )}
              </div>
            </Col>
          </Row>
          {/* Bằng cấp & Chứng chỉ */}
          <Row style={{marginTop:'20px'}}>
            <Col xs={24}>
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '24px',
                      backgroundColor: '#1890ff',
                      borderRadius: '2px'
                    }}></div>
                    <h3 style={{ 
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: '600',
                      color: 'rgb(24, 84, 119)'
                    }}>
                      Bằng cấp và Chứng chỉ :
                    </h3>
                  </div>
                </div>
              
              {dentist.certificates && dentist.certificates.length > 0 ? (
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px'
                }}>
                  {dentist.certificates.map((cert, index) => (
                    <li key={cert._id || index} style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      {/* Tên chứng chỉ với bullet tròn */}
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#313b79',
                          flexShrink: 0
                        }}></div>
                        <h4 style={{ 
                          color: '#313b79',
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: '600'
                        }}>
                          {cert.name}
                        </h4>
                      </div>
                      
                      {/* Hình ảnh chứng chỉ - hiển thị trực tiếp */}
                      <div style={{ 
                        display: 'flex',
                        gap: '20px',
                        flexWrap: 'wrap'
                      }}>
                        {/* Mặt trước */}
                        {cert.frontImage && (
                          <div style={{ flex: '1', minWidth: '300px' }}>
                            <img
                              alt={`${cert.name} - Mặt trước`}
                              src={cert.frontImage}
                              style={{
                                width: '100%',
                                height: '400px',
                                objectFit: 'contain',
                               
                              }}
                            />
                          </div>
                        )}

                        {/* Mặt sau */}
                        {cert.backImage && (
                          <div style={{ flex: '1', minWidth: '300px' }}>
                            <img
                              alt={`${cert.name} - Mặt sau`}
                              src={cert.backImage}
                              style={{
                                width: '100%',
                                height: '300px',
                                objectFit: 'contain',
                               
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px'
                }}>
                  <SafetyCertificateOutlined style={{ 
                    fontSize: '48px', 
                    color: '#d9d9d9',
                    marginBottom: '16px'
                  }} />
                  <Text style={{ color: '#999', fontSize: '16px' }}>
                    Chưa có bằng cấp hoặc chứng chỉ nào được tải lên
                  </Text>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default PublicDentistDetail;