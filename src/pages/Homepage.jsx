/*
* @author: HoTram
*/
import React from 'react';
import { Layout } from 'antd';
import HeroCarousel from '../components/Homepage/HeroCarousel';
import ServicesSection from '../components/Homepage/ServicesSection';
import FeaturesSection from '../components/Homepage/FeaturesSection';
import TestimonialsSection from '../components/Homepage/TestimonialsSection';
import CTASection from '../components/Homepage/CTASection';

const { Content } = Layout;

const Homepage = () => {

  return (
    <Content style={{ padding: 0, background: '#f5f5f5' }}>
      <HeroCarousel />
      <ServicesSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
    </Content>
  );
};

export default Homepage;
