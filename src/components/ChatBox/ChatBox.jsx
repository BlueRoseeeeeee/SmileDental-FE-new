import React, { useState, useEffect, useRef } from 'react';
import { MessageOutlined, CloseOutlined, SendOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons';
import { Input, Button, Avatar, Spin, message as antMessage } from 'antd';
import chatbotService from '../../services/chatbot.service';
import './ChatBox.css';

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

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
      antMessage.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.');
      
      // Remove user message if failed
      setMessages(prev => prev.filter(m => m !== userMessage));
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
                <Spin tip="Đang tải lịch sử..." />
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
                      <div className="message-content">{msg.content}</div>
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

          {/* Input Box */}
          <div className="chatbox-input">
            <Input.TextArea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn của bạn..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={loading || typing}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading || typing}
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
