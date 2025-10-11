/*
* @author: HoTram
*/
import React from 'react';
import { Carousel } from 'antd';
import { useNavigate } from 'react-router-dom';

const HeroCarousel = () => {
  const navigate = useNavigate();

  const carouselContent = [
    {
      image: '/src/assets/image/banner-caroseul.png',
      title: 'Nha khoa thẩm mỹ chuyên nghiệp',
      description: 'Đội ngũ bác sĩ giàu kinh nghiệm với trang thiết bị hiện đại',
      buttonText: 'Đặt lịch ngay',
      buttonAction: () => navigate('/login')
    },
    {
      image: '/src/assets/image/banner-caroseul.png',
      title: 'Dịch vụ toàn diện',
      description: 'Từ nha khoa tổng quát đến thẩm mỹ, chúng tôi có đầy đủ dịch vụ',
      buttonText: 'Xem dịch vụ',
      buttonAction: () => navigate('/services')
    },
    {
      image: '/src/assets/image/banner-caroseul.png',
      title: 'Chăm sóc tận tâm',
      description: 'Luôn đặt sức khỏe và sự hài lòng của khách hàng lên hàng đầu',
      buttonText: 'Liên hệ ngay',
      buttonAction: () => navigate('/contact')
    }
  ];

  return (
    <div style={{ position: 'relative', marginBottom: '0' }}>
      <Carousel 
        autoplay 
        effect="fade" 
        style={{ height: '70vh', minHeight: '500px' }}
        autoplaySpeed={5000}
        dots={{
          style: {
            bottom: '30px',
            zIndex: 10
          }
        }}
      >
        {carouselContent.map((item, index) => (
          <div key={index}>
            <div style={{
              backgroundImage: `url(${item.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              height: '70vh',
              minHeight: '500px'
            }}>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default HeroCarousel;
