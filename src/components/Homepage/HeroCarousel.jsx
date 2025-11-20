/*
* @author: HoTram
*/
import React from 'react';
import { Carousel, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import bannerCarousel from '../../assets/image/banner-caroseul.png';
import banner01 from '../../assets/image/banner-01.jpg';
import minhhoa from '../../assets/image/minhhoa.jpg';
import minhhoa2 from '../../assets/image/minhhoa2.png';
import bannerCarousel2 from '../../assets/image/banner-caroseul2.png';

const HeroCarousel = () => {
  const carouselRef = React.useRef(null);

  const carouselContent = [
    {
      image: bannerCarousel,
    },
    {
      image: banner01,
    },
    {
      image: minhhoa,
    },
    {
      image: minhhoa2,
    },
    {
      image: bannerCarousel2,
    }
  ];

  const handlePrev = () => {
    carouselRef.current?.prev();
  };

  const handleNext = () => {
    carouselRef.current?.next();
  };

  return (
    <div style={{ position: 'relative', marginBottom: '0' }}>
      <style>{`
        .carousel-nav-btn:hover {
          transform: translateY(-50%) !important;
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          color: rgba(0, 0, 0, 0.7) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
        }
        .carousel-nav-btn:focus {
          transform: translateY(-50%) !important;
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          color: rgba(0, 0, 0, 0.7) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
        }
        .carousel-nav-btn:active {
          transform: translateY(-50%) !important;
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          color: rgba(0, 0, 0, 0.7) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
      {/* Navigation Buttons */}
        <Button
          type="text"
          shape="circle"
          icon={<LeftOutlined />}
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            width: '50px',
            height: '50px',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'rgba(0, 0, 0, 0.7)',
            fontSize: '18px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
          className="carousel-nav-btn"
        />
      
      <Button
        type="text"
        shape="circle"
        icon={<RightOutlined />}
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 20,
          width: '50px',
          height: '50px',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'rgba(0, 0, 0, 0.7)',
          fontSize: '18px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
        className="carousel-nav-btn"
      />

      <Carousel 
        ref={carouselRef}
        autoplay 
        effect="fade" 
        style={{ height: '70vh', minHeight: '500px' }}
        autoplaySpeed={3000}
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
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#e2e8f0',
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
