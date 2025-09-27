/*
* @author: HoTram
* Toast Icon Component - Sử dụng Ant Design Icons
*/
import React from 'react';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

const ToastIcon = ({ type, size = 12 }) => {
  const iconProps = { 
    style: { 
      fontSize: size, 
      color: 'white' 
    } 
  };

  switch (type) {
    case 'success':
      return <CheckCircleOutlined {...iconProps} />;
    case 'error':
      return <CloseCircleOutlined {...iconProps} />;
    case 'warning':
      return <ExclamationCircleOutlined {...iconProps} />;
    case 'info':
      return <InfoCircleOutlined {...iconProps} />;
    default:
      return <InfoCircleOutlined {...iconProps} />;
  }
};

export default ToastIcon;
