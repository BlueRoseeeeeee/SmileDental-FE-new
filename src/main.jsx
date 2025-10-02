/*
* @author: HoTram
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import App from './App.jsx'

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
}

createRoot(document.getElementById('root')).render(
  <ConfigProvider theme={theme}>
    <App />
  </ConfigProvider>,
)
