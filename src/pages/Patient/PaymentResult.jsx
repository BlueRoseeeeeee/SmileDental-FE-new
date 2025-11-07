import React, { useEffect, useState } from 'react';
import { Result, Button, Card, Descriptions, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './PaymentResult.css';

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const payment = searchParams.get('payment'); // VNPay uses 'payment' param
  const status = searchParams.get('status') || payment; // Support both params
  const orderId = searchParams.get('orderId');
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  useEffect(() => {
    // Simulate checking payment status
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Check if user is staff (admin, manager, or receptionist)
  const isStaff = () => {
    const roles = user?.roles || [];
    return roles.includes('admin') || roles.includes('manager') || roles.includes('receptionist');
  };

  // Determine redirect path based on user role
  const getSuccessRedirectPath = () => {
    if (isStaff()) {
      return '/dashboard/invoices'; // Staff -> Invoices page
    }
    return '/patient/appointments'; // Patient -> Appointments page
  };

  const getResultConfig = () => {
    const successRedirectPath = getSuccessRedirectPath();
    
    switch (status) {
      case 'success':
        return {
          status: 'success',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          title: 'Thanh toán thành công!',
          subTitle: isStaff() 
            ? 'Thanh toán đã được xác nhận. Hóa đơn đã được cập nhật.' 
            : 'Cảm ơn bạn đã thanh toán. Lịch khám đã được xác nhận.',
          extra: [
            <Button type="primary" key="redirect" onClick={() => navigate(successRedirectPath)}>
              {isStaff() ? 'Về danh sách hóa đơn' : 'Xem lịch khám'}
            </Button>,
            <Button key="home" onClick={() => navigate(isStaff() ? '/dashboard' : '/patient')}>
              Về trang chủ
            </Button>,
          ],
        };
      
      case 'failed':
        return {
          status: 'error',
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
          title: 'Thanh toán thất bại',
          subTitle: `Đã có lỗi xảy ra trong quá trình thanh toán. ${message || 'Vui lòng thử lại.'}`,
          extra: [
            <Button type="primary" key="retry" onClick={() => navigate(isStaff() ? '/dashboard/invoices' : '/patient/booking/create-appointment')}>
              {isStaff() ? 'Quay lại hóa đơn' : 'Thử lại'}
            </Button>,
            <Button key="home" onClick={() => navigate(isStaff() ? '/dashboard' : '/patient')}>
              Về trang chủ
            </Button>,
          ],
        };
      
      case 'error':
        return {
          status: 'warning',
          icon: <WarningOutlined style={{ color: '#faad14' }} />,
          title: 'Có lỗi xảy ra',
          subTitle: message || 'Không thể xác nhận thanh toán. Vui lòng liên hệ với chúng tôi.',
          extra: [
            <Button type="primary" key="support" onClick={() => navigate(isStaff() ? '/dashboard/invoices' : '/patient/support')}>
              {isStaff() ? 'Quay lại hóa đơn' : 'Liên hệ hỗ trợ'}
            </Button>,
            <Button key="home" onClick={() => navigate(isStaff() ? '/dashboard' : '/patient')}>
              Về trang chủ
            </Button>,
          ],
        };
      
      default:
        return {
          status: 'info',
          title: 'Đang xử lý',
          subTitle: 'Vui lòng đợi trong giây lát...',
        };
    }
  };

  if (loading) {
    return (
      <div className="payment-result-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Spin size="large" tip="Đang xác nhận thanh toán..." />
      </div>
    );
  }

  const resultConfig = getResultConfig();

  return (
    <div className="payment-result-container">
      <Card className="payment-result-card">
        <Result
          {...resultConfig}
        />
        
        {orderId && (
          <div style={{ maxWidth: '600px', margin: '30px auto 0' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Mã giao dịch">
                <strong>{orderId}</strong>
              </Descriptions.Item>
              
              {code && (
                <Descriptions.Item label="Mã phản hồi">
                  {code}
                </Descriptions.Item>
              )}
              
              <Descriptions.Item label="Thời gian">
                {new Date().toLocaleString('vi-VN')}
              </Descriptions.Item>
              
              {status === 'success' && (
                <Descriptions.Item label="Trạng thái">
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    Đã thanh toán
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
        
        <div style={{ marginTop: '30px', textAlign: 'center', color: '#8c8c8c' }}>
          <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ hotline: <strong>1900-xxxx</strong></p>
        </div>
      </Card>
    </div>
  );
};

export default PaymentResult;
