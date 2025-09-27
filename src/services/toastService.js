/*
* @author: HoTram
* Toast Service - Thống nhất toàn bộ hệ thống sử dụng toast
*/
import React from 'react';
import { createRoot } from 'react-dom/client';
import ToastIcon from '../components/ToastIcon.jsx';

// Toast colors
const TOAST_COLORS = {
  success: '#52c41a',
  error: '#ff4d4f',
  warning: '#faad14',
  info: '#1890ff'
};

class ToastService {
  constructor() {
    this.toastContainer = null;
    this.init();
  }

  init() {
    // Đợi DOM load xong
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createContainer());
    } else {
      this.createContainer();
    }
  }

  createContainer() {
    // Tạo container cho toast nếu chưa có
    if (!document.getElementById('toast-container')) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        max-width: 400px;
      `;
      document.body.appendChild(this.toastContainer);
    } else {
      this.toastContainer = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 5000) {
    // Đảm bảo container đã được tạo
    if (!this.toastContainer || !document.getElementById('toast-container')) {
      this.createContainer();
    }
    
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.style.cssText = `
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      color: #333;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid ${TOAST_COLORS[type]};
      min-width: 320px;
      max-width: 420px;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.5;
      transform: translateX(100%);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    `;

    // Thêm icon và message
    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${TOAST_COLORS[type]};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        " id="toast-icon-${toastId}">
        </div>
        <div style="flex: 1;">
          <div style="
            font-weight: 600; 
            margin-bottom: 4px; 
            color: ${TOAST_COLORS[type]};
            font-size: 15px;
          ">${this.getTypeTitle(type)}</div>
          <div style="color: #555; font-size: 14px;">${message}</div>
        </div>
        <button 
          onclick="document.getElementById('${toastId}').remove()"
          style="
            background: rgba(0,0,0,0.05);
            border: none;
            color: #999;
            cursor: pointer;
            font-size: 16px;
            padding: 4px 8px;
            margin-left: 8px;
            flex-shrink: 0;
            border-radius: 4px;
            transition: all 0.2s ease;
          "
          onmouseover="this.style.background='rgba(0,0,0,0.1)'"
          onmouseout="this.style.background='rgba(0,0,0,0.05)'"
        >
          ×
        </button>
      </div>
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, ${TOAST_COLORS[type]}, ${TOAST_COLORS[type]}80);
        width: 100%;
        transform: scaleX(1);
        transform-origin: left;
        transition: transform ${duration}ms linear;
        border-radius: 0 0 12px 12px;
      "></div>
    `;

    // Thêm toast vào container
    this.toastContainer.appendChild(toast);

    // Render React icon vào toast
    const iconContainer = document.getElementById(`toast-icon-${toastId}`);
    if (iconContainer) {
      const root = createRoot(iconContainer);
      root.render(React.createElement(ToastIcon, { type, size: 12 }));
    }

    // Animation slide in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
      this.remove(toastId);
    }, duration);

    // Click to close
    toast.addEventListener('click', () => {
      this.remove(toastId);
    });

    return toastId;
  }

  remove(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  getTypeTitle(type) {
    const titles = {
      success: 'Thành công',
      error: 'Lỗi',
      warning: 'Cảnh báo',
      info: 'Thông tin'
    };
    return titles[type] || 'Thông báo';
  }

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  // Clear all toasts
  clear() {
    if (this.toastContainer) {
      this.toastContainer.innerHTML = '';
    }
  }
}

// Export singleton instance
export const toast = new ToastService();
