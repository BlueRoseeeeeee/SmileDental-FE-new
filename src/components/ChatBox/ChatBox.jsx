import React, { useState, useEffect, useRef } from 'react';
import { MessageOutlined, CloseOutlined, SendOutlined, DeleteOutlined, RobotOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import { Input, Button, Avatar, Spin, App } from 'antd';
import chatbotService from '../../services/chatbot.service';
import './ChatBox.css';

const ChatBox = () => {
  const { message: messageApi } = App.useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto scroll to bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  // Load chat history when opening chatbox
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await chatbotService.getHistory(20);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setTyping(true);

    try {
      const response = await chatbotService.sendMessage(inputMessage);
      
      setTyping(false);
      
      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error) {
      setTyping(false);
      console.error('Send message error:', error);
      messageApi.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.');
      
      // Remove user message if failed
      setMessages(prev => prev.filter(m => m !== userMessage));
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatbotService.clearHistory();
      setMessages([]);
      messageApi.success('Đã xóa lịch sử chat');
    } catch (error) {
      console.error('Clear history error:', error);
      messageApi.error('Không thể xóa lịch sử chat');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      messageApi.error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      messageApi.error('Kích thước ảnh tối đa 5MB');
      return;
    }

    setSelectedImage(file);
    
    // Show preview before sending
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSendImage = () => {
    if (!selectedImage || !imagePreview) return;

    // Add user message with image
    const userMessage = {
      role: 'user',
      content: '[Đã gửi ảnh] ' + (inputMessage || 'Phân tích ảnh răng của tôi'),
      imagePreview: imagePreview,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Send image for analysis
    handleSendImage(selectedImage);
    
    // Clear preview and input
    setImagePreview(null);
    setInputMessage('');
  };

  const handleSendImage = async (file) => {
    setUploadingImage(true);
    setTyping(true);

    try {
      const response = await chatbotService.analyzeImage(file, inputMessage);
      
      setTyping(false);
      setUploadingImage(false);
      
      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.analysis,
          suggestions: response.suggestions,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Show suggestions if any
        if (response.suggestions && response.suggestions.length > 0) {
          messageApi.success(`Gợi ý dịch vụ: ${response.suggestions.join(', ')}`);
        }
      } else {
        throw new Error(response.message || 'Không thể phân tích ảnh');
      }
    } catch (error) {
      setTyping(false);
      setUploadingImage(false);
      console.error('Send image error:', error);
      messageApi.error(error.response?.data?.message || 'Có lỗi xảy ra khi phân tích ảnh');
    } finally {
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle paste image (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          handleImageSelect({ target: { files: [file] } });
        }
        break;
      }
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageSelect({ target: { files: [file] } });
      } else {
        messageApi.error('Chỉ chấp nhận file ảnh');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemovePreview = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleChatBox = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chatbox-container">
      {/* Floating Button */}
      {!isOpen && (
        <div className="chatbox-button" onClick={toggleChatBox}>
          <MessageOutlined className="chatbox-icon" />
          <span className="chatbox-badge">AI</span>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbox-window">
          {/* Header */}
          <div className="chatbox-header">
            <div className="chatbox-header-content">
              <Avatar 
                icon={<RobotOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
              />
              <div className="chatbox-header-text">
                <div className="chatbox-title">SmileCare AI</div>
                <div className="chatbox-subtitle">Trợ lý ảo nha khoa</div>
              </div>
            </div>
            <div className="chatbox-header-actions">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleClearHistory}
                title="Xóa lịch sử chat"
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={toggleChatBox}
              />
            </div>
          </div>

          {/* Messages Container */}
          <div className="chatbox-messages">
            {loading ? (
              <div className="chatbox-loading">
                <Spin tip="Đang tải lịch sử..." size="large">
                  <div style={{ padding: '50px' }} />
                </Spin>
              </div>
            ) : messages.length === 0 ? (
              <div className="chatbox-welcome">
                <RobotOutlined className="welcome-icon" />
                <h3>Chào bạn! 👋</h3>
                <p>Tôi là SmileCare AI, trợ lý ảo của phòng khám nha khoa SmileCare.</p>
                <p>Bạn có thể hỏi tôi về:</p>
                <ul>
                  <li>Dịch vụ nha khoa</li>
                  <li>Giá cả và chi phí</li>
                  <li>Đặt lịch khám</li>
                  <li>Tư vấn răng miệng</li>
                </ul>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chatbox-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar 
                        icon={<RobotOutlined />} 
                        size="small"
                        style={{ backgroundColor: '#1890ff' }}
                      />
                    )}
                    <div className="message-bubble">
                      {msg.imagePreview && (
                        <div className="message-image-preview">
                          <img src={msg.imagePreview} alt="Uploaded teeth" />
                        </div>
                      )}
                      <div className="message-content">{msg.content}</div>
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="message-suggestions">
                          <strong>💡 Gợi ý dịch vụ:</strong>
                          <ul>
                            {msg.suggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <Avatar 
                        style={{ backgroundColor: '#52c41a' }}
                        size="small"
                      >
                        U
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {typing && (
                  <div className="chatbox-message assistant">
                    <Avatar 
                      icon={<RobotOutlined />} 
                      size="small"
                      style={{ backgroundColor: '#1890ff' }}
                    />
                    <div className="message-bubble typing">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Drag Overlay */}
          {isDragging && (
            <div className="chatbox-drag-overlay">
              <PictureOutlined style={{ fontSize: 48, color: '#667eea' }} />
              <p>Thả ảnh vào đây để gửi</p>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="chatbox-image-preview-container">
              <div className="image-preview-header">
                <span>Xem trước ảnh</span>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  size="small"
                  onClick={handleRemovePreview}
                />
              </div>
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <Input.TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Thêm câu hỏi về ảnh (tùy chọn)..."
                autoSize={{ minRows: 1, maxRows: 2 }}
                style={{ marginTop: 8 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleConfirmSendImage}
                loading={uploadingImage}
                block
                style={{ marginTop: 8 }}
              >
                Gửi ảnh để phân tích
              </Button>
            </div>
          )}

          {/* Input Box */}
          <div 
            className="chatbox-input"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
            />
            <Button
              type="default"
              icon={uploadingImage ? <LoadingOutlined /> : <PictureOutlined />}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || typing || uploadingImage || imagePreview}
              title="Chọn ảnh từ máy tính"
              style={{ 
                color: '#667eea', 
                borderColor: '#667eea',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Chọn ảnh
            </Button>
            <Input.TextArea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Nhập câu hỏi hoặc paste ảnh (Ctrl+V)..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={loading || typing || imagePreview}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading || typing || imagePreview}
              className="send-button"
            >
              Gửi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
