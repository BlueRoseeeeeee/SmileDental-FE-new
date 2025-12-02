/**
 * Trang danh sách nha sĩ công khai
 * @author: HoTram
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Card,
  Input,
  Spin, 
  Empty,
  Typography,
  Pagination
} from 'antd';
import { 
  UserOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { userService } from '../services';
import { COLOR_BRAND_NAME } from '../utils/common-colors';

const { Title, Text } = Typography;

const PublicDentistList = () => {
  const navigate = useNavigate();
  const [dentists, setDentists] = useState([]);
  const [filteredDentists, setFilteredDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchDentists();
  }, []);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredDentists(dentists);
    } else {
      const filtered = dentists.filter(dentist => 
        dentist.fullName?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredDentists(filtered);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchText, dentists]);

  const fetchDentists = async () => {
    try {
      setLoading(true);
      // Gọi API lấy danh sách users với role = dentist
      const response = await userService.getUsers({ role: 'dentist', isActive: true });
      
      if (response.success && response.users) {
        setDentists(response.users);
        setFilteredDentists(response.users);
      } else {
        setDentists([]);
        setFilteredDentists([]);
      }
    } catch (error) {
      console.error('Error fetching dentists:', error);
      setDentists([]);
      setFilteredDentists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDentistClick = (dentistId) => {
    navigate(`/dentist-detail/${dentistId}`);
  };

  // Get current page data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentDentists = filteredDentists.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            Đang tải danh sách nha sĩ...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{ 
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Search - Top Right */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '24px'
        }}>
          <Input
            size="large"
            placeholder="Tìm kiếm nha sĩ..."
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              borderRadius: '50px',
              width: '500px'
            }}
          />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h5 level={1} style={{ 
            color: '#2596be',
            fontSize: '36px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            ĐỘI NGŨ NHA SĨ
          </h5>
          <h5 style={{ 
            fontSize: '16px',
            display: 'block'
          }}>
            Đội ngũ nha sĩ tài giỏi giàu kinh nghiệm
          </h5>
        </div>

        {/* Dentist Cards */}
        {filteredDentists.length === 0 ? (
          <Empty 
            description="Không tìm thấy nha sĩ nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '16px'
            }}
          />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {currentDentists.map((dentist) => (
              <Card
                key={dentist._id}
                hoverable
                onClick={() => handleDentistClick(dentist._id)}
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '250px'
                }}
                bodyStyle={{ padding: '40px 32px', height: '100%' }}
              >
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '28px',
                  height: '100%',
                }}>
                  {/* Avatar */}
                  {dentist.avatar ? (
                    <img
                      src={dentist.avatar}
                      alt={dentist.fullName}
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        backgroundColor: 'rgb(49, 59, 121)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <UserOutlined style={{ fontSize: '56px', color: 'white' }} />
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    {/* Name */}
                    <h4 style={{ 
                      margin: '0 0 12px 0',
                      color: COLOR_BRAND_NAME,
                      fontSize: '22px',
                      fontWeight: '600'
                    }}>
                      NS. {dentist.fullName}
                    </h4>

                    {/* Description Preview */}
                    {dentist.description && (
                      <div 
                        style={{
                          fontSize: '15px',
                          color: '#666',
                          lineHeight: '1.6',
                          display: '-webkit-box',
                          WebkitLineClamp: 6,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: dentist.description 
                        }}
                      />
                    )}
                  </div>

                  {/* View Detail Button - Bottom Right */}
                  <div style={{
                    alignSelf: 'flex-end',
                    padding: '8px 24px',
                    backgroundColor: '#e6f7ff',
                    color: '#1890ff',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0
                  }}>
                    Xem chi tiết →
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '40px' 
          }}>
            <Pagination
              current={currentPage}
              total={filteredDentists.length}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
              showTotal={(total) => `Tổng ${total} nha sĩ`}
            />
          </div>
        </>
        )}
      </div>
    </div>
  );
};

export default PublicDentistList;
