import React from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <Result
            status="500"
            title="Oops! Có lỗi xảy ra"
            subTitle={this.state.error?.message || "Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý."}
            extra={[
              <Button type="primary" key="home" icon={<HomeOutlined />} onClick={() => window.location.href = '/patient'}>
                Về trang chủ
              </Button>,
              <Button key="reload" onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>
            ]}
          />
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: 20, padding: 20, background: '#f5f5f5', borderRadius: 4 }}>
              <summary>Chi tiết lỗi (Development Only)</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <p>{this.state.errorInfo.componentStack}</p>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
