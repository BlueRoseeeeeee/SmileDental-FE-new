/*
 * @author: TrungNghia & ThuTram
 * Holiday Management Page - Trang quản lý ngày nghỉ lễ độc lập
 */
import React from 'react';
import { Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import HolidayManagement from './HolidayManagement';

const { Title, Text } = Typography;

const HolidayManagementPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          Quản lý Ngày nghỉ
        </Title>
        <Text type="secondary">
          Quản lý ngày nghỉ lễ cố định và không cố định trong hệ thống
        </Text>
      </div>

      <HolidayManagement />
    </div>
  );
};

export default HolidayManagementPage;
