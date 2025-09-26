# Auth Service Implementation - Smile Dental Frontend

## Tổng quan

Đã implement đầy đủ các chức năng authentication và user management cho frontend Smile Dental, tương thích hoàn toàn với auth-service backend.

## Các chức năng đã implement

### 1. Authentication Components

#### Login (`/login`)
- **Chức năng**: Đăng nhập với email hoặc employeeCode
- **UI**: Form đẹp với Ant Design, responsive
- **Features**: 
  - Hỗ trợ đăng nhập bằng email hoặc mã nhân viên
  - Remember me checkbox
  - Link quên mật khẩu
  - Error handling với thông báo rõ ràng

#### Register (`/register`)
- **Chức năng**: Đăng ký tài khoản mới với OTP verification
- **UI**: Multi-step form với progress indicator
- **Features**:
  - Step 1: Gửi OTP đến email
  - Step 2: Nhập thông tin và OTP để hoàn thành đăng ký
  - Validation đầy đủ cho tất cả fields
  - Hỗ trợ các role: patient, dentist, nurse, receptionist

#### Forgot Password (`/forgot-password`)
- **Chức năng**: Reset mật khẩu với OTP
- **UI**: Multi-step form
- **Features**:
  - Step 1: Nhập email để nhận OTP
  - Step 2: Nhập OTP và mật khẩu mới
  - Success page với link đăng nhập

#### Change Password (`/change-password`)
- **Chức năng**: Đổi mật khẩu (yêu cầu mật khẩu hiện tại)
- **UI**: Form đơn giản với validation
- **Features**:
  - Xác thực mật khẩu hiện tại
  - Validation mật khẩu mới (8-16 ký tự)
  - Success page

### 2. User Management Components

#### Profile (`/profile`)
- **Chức năng**: Xem và chỉnh sửa thông tin cá nhân
- **UI**: Card layout với avatar upload
- **Features**:
  - Xem thông tin profile
  - Edit mode với form validation
  - Upload avatar
  - Hiển thị thông tin tài khoản và thống kê

#### User Management (`/users`) - Admin/Manager only
- **Chức năng**: Quản lý tất cả người dùng trong hệ thống
- **UI**: Table với search, filter, pagination
- **Features**:
  - Danh sách người dùng với avatar, thông tin cơ bản
  - Search theo tên, email, số điện thoại
  - Filter theo role và trạng thái
  - CRUD operations (Create, Read, Update, Delete)
  - Stats cards hiển thị thống kê
  - Modal xem chi tiết và chỉnh sửa

#### Certificate Management (`/certificates`) - Dentist only
- **Chức năng**: Quản lý chứng chỉ chuyên môn
- **UI**: Grid layout với upload modal
- **Features**:
  - Upload chứng chỉ (ảnh)
  - Xem danh sách chứng chỉ với trạng thái
  - Edit notes cho từng chứng chỉ
  - Delete chứng chỉ
  - Preview ảnh chứng chỉ
  - Stats hiển thị số lượng chứng chỉ đã xác thực/chờ xác thực

### 3. Services & Context

#### AuthService (`/services/authService.js`)
- **Chức năng**: API calls cho authentication
- **Features**:
  - Login/Logout với token management
  - OTP sending (register/reset password)
  - Password change/reset
  - Auto token refresh
  - Local storage management

#### UserService (`/services/userService.js`)
- **Chức năng**: API calls cho user management
- **Features**:
  - Profile management
  - User CRUD operations
  - Avatar upload
  - Certificate management
  - Staff search và filtering

#### AuthContext (`/contexts/AuthContext.jsx`)
- **Chức năng**: Global state management cho authentication
- **Features**:
  - User state management
  - Login/Logout functions
  - Error handling
  - Loading states

#### API Interceptor (`/services/api.js`)
- **Chức năng**: Axios interceptor với auto token refresh
- **Features**:
  - Auto add Authorization header
  - Handle 401 errors với token refresh
  - Error handling và redirect

### 4. Layout & Navigation

#### DashboardLayout
- **Chức năng**: Main layout với sidebar navigation
- **Features**:
  - Role-based menu items
  - Responsive design (mobile drawer)
  - User dropdown với profile, change password, logout
  - Search bar và notifications

#### ProtectedRoute
- **Chức năng**: Route protection based on authentication và roles
- **Features**:
  - Check authentication
  - Role-based access control
  - Redirect to login nếu chưa đăng nhập
  - Redirect to unauthorized nếu không đủ quyền

## API Endpoints được sử dụng

### Authentication
- `POST /auth/send-otp-register` - Gửi OTP đăng ký
- `POST /auth/send-otp-reset-password` - Gửi OTP reset password
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/logout` - Đăng xuất
- `POST /auth/refresh` - Refresh token
- `POST /auth/change-password` - Đổi mật khẩu
- `POST /auth/reset-password` - Reset mật khẩu

### User Management
- `GET /user/profile` - Lấy thông tin profile
- `PUT /user/profile` - Cập nhật profile
- `GET /user/all-staff` - Lấy danh sách staff (admin/manager)
- `GET /user/staff/search` - Tìm kiếm staff
- `GET /user/:id` - Lấy thông tin user theo ID
- `PUT /user/update/:id` - Cập nhật user (admin/manager)
- `DELETE /user/:id` - Xóa user (admin/manager)
- `PUT /user/avatar/:id` - Upload avatar

### Certificate Management
- `POST /user/:id/certificates` - Upload chứng chỉ
- `DELETE /user/:userId/certificates/:certificateId` - Xóa chứng chỉ
- `PATCH /user/:userId/certificates/:certificateId/verify` - Xác thực chứng chỉ
- `PATCH /user/:userId/certificates/:certificateId/notes` - Cập nhật ghi chú

## Cách sử dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment
Tạo file `.env` với:
```
REACT_APP_API_URL=http://localhost:3001/api
```

### 3. Chạy ứng dụng
```bash
npm run dev
```

### 4. Test các chức năng

#### Authentication Flow
1. Truy cập `/register` để đăng ký tài khoản mới
2. Truy cập `/login` để đăng nhập
3. Truy cập `/forgot-password` để reset mật khẩu
4. Truy cập `/change-password` để đổi mật khẩu

#### User Management
1. Đăng nhập với role admin/manager
2. Truy cập `/users` để quản lý người dùng
3. Truy cập `/profile` để xem/chỉnh sửa thông tin cá nhân

#### Certificate Management
1. Đăng nhập với role dentist
2. Truy cập `/certificates` để quản lý chứng chỉ

## Role-based Access Control

### Admin
- Truy cập tất cả chức năng
- Quản lý người dùng
- Quản lý lịch làm việc

### Manager
- Tương tự admin
- Quản lý người dùng
- Quản lý lịch làm việc

### Dentist
- Quản lý profile
- Quản lý chứng chỉ
- Quản lý bệnh nhân
- Xem lịch hẹn

### Nurse
- Quản lý profile
- Quản lý bệnh nhân
- Xem lịch hẹn

### Receptionist
- Quản lý profile
- Xem lịch hẹn

### Patient
- Quản lý profile
- Xem danh sách nha sĩ
- Đặt lịch hẹn

## Features nổi bật

1. **Responsive Design**: Hoạt động tốt trên desktop và mobile
2. **Role-based UI**: Menu và chức năng thay đổi theo role
3. **Auto Token Refresh**: Tự động refresh token khi hết hạn
4. **Form Validation**: Validation đầy đủ cho tất cả forms
5. **Error Handling**: Xử lý lỗi thân thiện với người dùng
6. **Loading States**: Hiển thị loading khi đang xử lý
7. **Success/Error Messages**: Thông báo rõ ràng cho mọi action
8. **File Upload**: Hỗ trợ upload avatar và chứng chỉ
9. **Search & Filter**: Tìm kiếm và lọc dữ liệu
10. **Pagination**: Phân trang cho danh sách dài

## Cấu trúc thư mục

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ChangePassword.jsx
│   │   └── ProtectedRoute.jsx
│   ├── User/
│   │   ├── Profile.jsx
│   │   ├── UserManagement.jsx
│   │   └── CertificateManagement.jsx
│   └── Layout/
│       └── DashboardLayout.jsx
├── contexts/
│   └── AuthContext.jsx
├── services/
│   ├── api.js
│   ├── authService.js
│   └── userService.js
└── pages/
    ├── Dashboard.jsx
    └── Profile.jsx
```

## Lưu ý quan trọng

1. **Backend Integration**: Đảm bảo auth-service backend đang chạy trên port 3001
2. **CORS**: Backend phải cấu hình CORS cho frontend domain
3. **Environment**: Cập nhật API_URL trong environment variables
4. **Token Storage**: Tokens được lưu trong localStorage
5. **Security**: Không expose sensitive data trong frontend
6. **Error Handling**: Tất cả API calls đều có error handling
7. **Loading States**: UI hiển thị loading state cho better UX

## Troubleshooting

### Lỗi thường gặp

1. **CORS Error**: Kiểm tra CORS configuration trong backend
2. **401 Unauthorized**: Kiểm tra token và refresh token
3. **Network Error**: Kiểm tra API URL và backend status
4. **Validation Error**: Kiểm tra form validation rules

### Debug

1. Mở Developer Tools để xem network requests
2. Kiểm tra localStorage cho tokens
3. Xem console logs cho error messages
4. Kiểm tra API responses

## Kết luận

Đã implement đầy đủ hệ thống authentication và user management cho Smile Dental frontend với:

- ✅ Complete authentication flow (login, register, forgot password, change password)
- ✅ User management với CRUD operations
- ✅ Certificate management cho dentist
- ✅ Role-based access control
- ✅ Responsive design với Ant Design
- ✅ Error handling và loading states
- ✅ Auto token refresh
- ✅ File upload support
- ✅ Search và filter functionality

Tất cả components đều được implement với Ant Design và responsive, sẵn sàng để sử dụng trong production.
