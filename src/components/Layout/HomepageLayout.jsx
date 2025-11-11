/*
* @author: HoTram
*/
import React from 'react';
import { Layout } from 'antd';
import Header from './Header';
import Footer from './Footer';
import ChatBox from '../ChatBox';

const { Content } = Layout;

const HomepageLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Content style={{ flex: 1 }}>
        {children}
      </Content>
      <Footer />
      <ChatBox />
    </Layout>
  );
};

export default HomepageLayout;
