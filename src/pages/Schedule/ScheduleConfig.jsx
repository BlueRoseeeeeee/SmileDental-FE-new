/**
 * @author: HoTram
 * Schedule Config - Trang cấu hình hệ thống lịch làm việc
 */
import React, { useState, useEffect } from 'react';
import { Card, Tabs, Alert, Spin, Button, Space, Typography } from 'antd';
import { 
  SettingOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { scheduleConfigService } from '../../services/index.js';
import { toast } from '../../services/toastService.js';
import ScheduleConfigForm from '../../components/Schedule/ScheduleConfigForm.jsx';
import HolidayManagement from './HolidayManagement.jsx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ScheduleConfig = () => {
  const [loading, setLoading] = useState(true);
  const [configExists, setConfigExists] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('config');

  // Kiểm tra cấu hình tồn tại
  const checkConfigExists = async () => {
    try {
      const response = await scheduleConfigService.checkConfigExists();
      console.log('Check config exists response:', response);
      setConfigExists(response.data?.exists || false);
      
      if (response.data?.exists) {
        await loadConfig();
      }
    } catch (error) {
      console.error('Error checking config:', error);
      toast.error('Không thể kiểm tra cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // Load cấu hình hiện tại
  const loadConfig = async () => {
    try {
      const response = await scheduleConfigService.getConfig();
      console.log('Load config response:', response);
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Không thể tải cấu hình hệ thống');
    }
  };

  // Khởi tạo cấu hình lần đầu
  const handleInitializeConfig = async () => {
    try {
      setLoading(true);
      const configData = {
        singletonKey: "SCHEDULE_CONFIG_SINGLETON",
        morningShift: {
          name: "Ca Sáng",
          startTime: "08:00",
          endTime: "11:30",
          isActive: true
        },
        afternoonShift: {
          name: "Ca Chiều", 
          startTime: "13:00",
          endTime: "17:00",
          isActive: true
        },
        eveningShift: {
          name: "Ca Tối",
          startTime: "18:00",
          endTime: "19:30", 
          isActive: true
        },
        unitDuration: 15,
        maxBookingDays: 30
      };
      
      const response = await scheduleConfigService.initializeConfig(configData);
      setConfigExists(true);
      setConfig(response.data);
      toast.success('Khởi tạo cấu hình thành công!');
    } catch (error) {
      console.error('Error initializing config:', error);
      toast.error('Không thể khởi tạo cấu hình');
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật cấu hình
  const handleConfigUpdate = async (updatedConfig) => {
    try {
      setLoading(true);
      console.log('Updating config with data:', updatedConfig);
      const response = await scheduleConfigService.updateConfig(updatedConfig);
      console.log('Update config response:', response);
      setConfig(response.data);
      toast.success('Cập nhật cấu hình thành công!');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Không thể cập nhật cấu hình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConfigExists();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Nếu chưa có cấu hình
  if (!configExists) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ExclamationCircleOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#faad14', 
                marginBottom: '16px' 
              }} 
            />
            <Title level={3}>Chưa có cấu hình hệ thống</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
              Hệ thống chưa được cấu hình lần đầu. Vui lòng khởi tạo cấu hình để sử dụng các tính năng lịch làm việc.
            </Text>
            <Button 
              type="primary" 
              size="large"
              icon={<SettingOutlined />}
              onClick={handleInitializeConfig}
              loading={loading}
            >
              Khởi tạo cấu hình hệ thống
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Cấu hình Hệ thống
        </Title>
        <Text type="secondary">
          Quản lý cấu hình ca làm việc và ngày nghỉ lễ
        </Text>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        size="large"
      >
        <TabPane 
          tab={
            <span>
              <ClockCircleOutlined />
              Cấu hình Ca làm việc
            </span>
          } 
          key="config"
        >
          <ScheduleConfigForm 
            config={config}
            onUpdate={handleConfigUpdate}
            loading={loading}
          />
        </TabPane>

        <TabPane 
          tab={
            <span>
              <CalendarOutlined />
              Quản lý Ngày nghỉ
            </span>
          } 
          key="holidays"
        >
          <HolidayManagement />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ScheduleConfig;
