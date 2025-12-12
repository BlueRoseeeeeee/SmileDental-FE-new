import React, { useState, useEffect, useRef } from 'react';
import { MessageOutlined, CloseOutlined, SendOutlined, DeleteOutlined, RobotOutlined, PictureOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Input, Button, Avatar, Spin, message as antMessage, Upload } from 'antd';
import chatbotService from '../services/chatbot.service';
import robotCuteImg from '../assets/icon/robot_cute.png';
import robotTuVan from '../assets/icon/robot-tuvan-dethuong.png';
import './ChatBox.css';

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For image upload
  const [imagePreview, setImagePreview] = useState(null); // For image preview
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
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage = {
      role: 'user',
      content: inputMessage || (selectedImage ? '📷 [Đã gửi ảnh]' : ''),
      timestamp: new Date(),
      image: imagePreview // Store image preview for display
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setTyping(true);

    try {
      console.log('📤 Sending message...', { 
        hasText: !!inputMessage, 
        hasImage: !!selectedImage 
      });

      const response = await chatbotService.sendMessage(inputMessage, selectedImage);
      
      console.log('📥 Response received:', response);
      
      setTyping(false);
      
      if (response.success) {
        // Handle image analysis response
        if (response.analysis) {
          const assistantMessage = {
            role: 'assistant',
            content: response.analysis,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } 
        // Handle regular chat response
        else if (response.response) {
          const assistantMessage = {
            role: 'assistant',
            content: response.response,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
        
        // 🔥 Check if response contains booking data for payment redirect
        if (response.redirectToPayment && response.bookingData) {
          console.log('💳 Booking confirmed, preparing to redirect to payment page');
          console.log('Booking data:', response.bookingData);
          
          // Store booking data in localStorage (same as normal booking flow)
          localStorage.setItem('booking_service', JSON.stringify(response.bookingData.service));
          
          // Only store serviceAddOn if it exists (user selected addon)
          if (response.bookingData.serviceAddOn) {
            localStorage.setItem('booking_serviceAddOn', JSON.stringify(response.bookingData.serviceAddOn));
            localStorage.setItem('booking_serviceAddOn_userSelected', response.bookingData.serviceAddOnUserSelected ? 'true' : 'false');
          } else {
            localStorage.removeItem('booking_serviceAddOn');
            localStorage.removeItem('booking_serviceAddOn_userSelected');
          }
          
          localStorage.setItem('booking_dentist', JSON.stringify(response.bookingData.dentist));
          localStorage.setItem('booking_date', response.bookingData.date);
          localStorage.setItem('booking_slotGroup', JSON.stringify(response.bookingData.slotGroup));
          
          // Store examRecordId if exists (for recommended services)
          if (response.bookingData.examRecordId) {
            localStorage.setItem('booking_examRecordId', response.bookingData.examRecordId);
          } else {
            localStorage.removeItem('booking_examRecordId');
          }
          
          // Show notification and redirect after 2 seconds
          antMessage.success({
            content: 'Đang chuyển đến trang thanh toán...',
            duration: 2
          });
          
          setTimeout(() => {
            window.location.href = '/patient/booking/create-appointment';
          }, 2000);
        }
      } else {
        // Handle non-teeth image or other errors
        if (response.isTeethImage === false) {
          const errorMessage = {
            role: 'assistant',
            content: response.message || 'Ảnh bạn gửi không phải là hình răng/miệng. Vui lòng gửi lại ảnh răng để tôi có thể tư vấn chính xác hơn. 🦷',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        } else {
          throw new Error(response.message || 'Failed to get response');
        }
      }
    } catch (error) {
      setTyping(false);
      console.error('❌ Send message error:', error);
      antMessage.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.');
      
      // Remove user message if failed
      setMessages(prev => prev.filter(m => m !== userMessage));
    } finally {
      // Clear image selection
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        antMessage.error('Vui lòng chọn file ảnh!');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        antMessage.error('Kích thước ảnh không được vượt quá 5MB!');
        return;
      }
      
      // Validate image dimensions
      const img = new Image();
      img.onload = () => {
        // Check minimum dimensions (200x200px)
        if (img.width < 200 || img.height < 200) {
          antMessage.error('Ảnh quá nhỏ! Kích thước tối thiểu là 200x200 pixels.');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
        
        // Check maximum dimensions (4096x4096px)
        if (img.width > 4096 || img.height > 4096) {
          antMessage.error('Ảnh quá lớn! Kích thước tối đa là 4096x4096 pixels.');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
        
        // All validations passed - set the image
        setSelectedImage(file);
        setImagePreview(img.src);
      };
      
      img.onerror = () => {
        antMessage.error('Không thể đọc file ảnh. Vui lòng chọn ảnh khác!');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      // Create preview and validate dimensions
      const reader = new FileReader();
      reader.onloadend = () => {
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatbotService.clearHistory();
      setMessages([]);
      antMessage.success('Đã xóa lịch sử chat');
    } catch (error) {
      console.error('Clear history error:', error);
      antMessage.error('Không thể xóa lịch sử chat');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
                src={robotCuteImg}
                style={{ backgroundColor: 'transparent' }}
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
                <Spin tip="Đang tải lịch sử...">
                  <div style={{ minHeight: '100px' }} />
                </Spin>
              </div>
            ) : messages.length === 0 ? (
              <div className="chatbox-welcome">
                <img src={robotTuVan} alt="Robot" className="welcome-icon" style={{ width: '300px', height: '150px' , marginTop:'-45px'}} />
                <h3 style={{marginTop:'-2px'}}>Chào bạn! 👋</h3>
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
                        src={robotCuteImg}
                        size="small"
                        style={{ backgroundColor: 'transparent' }}
                      />
                    )}
                    <div className="message-bubble">
                      {/* Display image if present */}
                      {msg.image && (
                        <div style={{ marginBottom: '8px' }}>
                          <img 
                            src={msg.image} 
                            alt="Uploaded" 
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '200px', 
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(msg.image, '_blank')}
                          />
                        </div>
                      )}
                      
                      <div className="message-content">
                        {/* Parse Markdown links [text](url) into clickable <a> tags */}
                        {msg.content.split(/(\[.+?\]\(.+?\))/).map((part, i) => {
                          const linkMatch = part.match(/\[(.+?)\]\((.+?)\)/);
                          if (linkMatch) {
                            return (
                              <a 
                                key={i} 
                                href={linkMatch[2]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#1890ff', textDecoration: 'underline', fontWeight: 'bold' }}
                              >
                                {linkMatch[1]}
                              </a>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
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
                      src={robotCuteImg}
                      size="small"
                      style={{ backgroundColor: 'transparent' }}
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

          {/* Image Preview - Hiển thị phía trên input */}
          {imagePreview && (
            <div style={{ 
              padding: '8px 12px', 
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fafafa'
            }}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  objectFit: 'cover', 
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }} 
              />
              <span style={{ flex: 1, fontSize: '12px', color: '#666' }}>
                {selectedImage?.name}
              </span>
              <Button 
                type="text" 
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={handleRemoveImage}
                danger
              />
            </div>
          )}

          {/* Input Box */}
          <div className="chatbox-input">
            <div style={{ display: 'flex', gap: '8px', padding: '12px' }}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              
              {/* Image upload button */}
              <Button
                type="text"
                icon={<PictureOutlined />}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || typing}
                title="Gửi ảnh để AI phân tích"
                style={{ 
                  color: selectedImage ? '#1890ff' : '#666',
                  fontSize: '18px'
                }}
              />
              
              <Input.TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedImage ? "Mô tả thêm về ảnh (tùy chọn)..." : "Nhập câu hỏi ..."}
                autoSize={{ minRows: 1, maxRows: 3 }}
                disabled={loading || typing}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && !selectedImage) || loading || typing}
                className="send-button"
              >
                Gửi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
