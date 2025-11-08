import React from 'react';
import './HomePage.css';
import HeroCarousel from '../../components/Homepage/HeroCarousel';
import ServicesSection from '../../components/Homepage/ServicesSection';
import FeaturesSection from '../../components/Homepage/FeaturesSection';
import DentistsSection from '../../components/Homepage/DentistsSection';

const HomePage = () => {

  

  return (
    <div className="patient-home-page">
      <HeroCarousel />
      <ServicesSection />
      <FeaturesSection />
      <DentistsSection />
    </div>
  );
};

export default HomePage;
