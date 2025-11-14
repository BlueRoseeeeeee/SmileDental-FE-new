/*
* @author: HoTram
*/
import React from 'react';
import { Layout } from 'antd';
import Header from './Header';
import Footer from './Footer';

const { Content } = Layout;

const HomepageLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Content style={{ flex: 1 }}>
        {children}
      </Content>
      <Footer />
    </Layout>
  );
};

export default HomepageLayout;
