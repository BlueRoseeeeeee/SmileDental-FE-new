# Chức năng Quản lý Nhân viên

## Tổng quan
Hệ thống quản lý nhân viên cho phép admin và manager thêm, xem, chỉnh sửa và xóa nhân viên trong hệ thống SmileDental.

## Các Component

### 1. UserManagement.jsx
Component chính để quản lý danh sách nhân viên với các tính năng:
- Hiển thị danh sách nhân viên dạng bảng
- Tìm kiếm nhân viên theo tên
- Lọc nhân viên theo vai trò
- Phân trang
- Thao tác: Xem chi tiết, Chỉnh sửa, Xóa

### 2. AddEmployeeForm.jsx
Form thêm nhân viên mới với 3 bước:
- **Bước 1**: Thông tin cơ bản (Họ tên, Email, Số điện thoại, Vai trò)
- **Bước 2**: Thông tin chi tiết (Ngày sinh, Giới tính, Địa chỉ, Chuyên môn, Mô tả)
- **Bước 3**: Tạo tài khoản (Gửi OTP, Nhập OTP, Mật khẩu)

### 3. EditEmployeeForm.jsx
Form chỉnh sửa thông tin nhân viên hiện có:
- Cập nhật thông tin cá nhân
- Thay đổi vai trò
- Cập nhật trạng thái hoạt động
- Chỉnh sửa chuyên môn (đối với nha sĩ)

### 4. EmployeeDetailModal.jsx
Modal hiển thị chi tiết thông tin nhân viên với 3 tab:
- **Tab 1**: Thông tin cơ bản và chuyên môn
- **Tab 2**: Thông tin hệ thống
- **Tab 3**: Chứng chỉ (chỉ dành cho nha sĩ)

## Các Vai trò Nhân viên

| Vai trò | Mã nhân viên | Mô tả |
|---------|--------------|-------|
| Admin | A0000001, A0000002... | Quản trị viên hệ thống |
| Manager | M0000001, M0000002... | Quản lý |
| Dentist | D0000001, D0000002... | Nha sĩ |
| Nurse | N0000001, N0000002... | Y tá |
| Receptionist | R0000001, R0000002... | Lễ tân |

## Quy trình Thêm Nhân viên

1. **Nhấn nút "Thêm nhân viên"** trong trang quản lý nhân viên
2. **Điền thông tin cơ bản**:
   - Họ và tên (bắt buộc)
   - Email (bắt buộc, phải hợp lệ)
   - Số điện thoại (bắt buộc, 10-11 chữ số)
   - Vai trò (bắt buộc)
3. **Điền thông tin chi tiết**:
   - Ngày sinh (bắt buộc)
   - Giới tính (bắt buộc)
   - Địa chỉ (bắt buộc)
   - Chuyên môn (bắt buộc nếu là nha sĩ)
   - Mô tả thêm (tùy chọn)
4. **Tạo tài khoản**:
   - Nhấn "Gửi mã OTP" để gửi OTP đến email
   - Nhập mã OTP 6 chữ số
   - Đặt mật khẩu (8-16 ký tự)
   - Xác nhận mật khẩu
5. **Hoàn tất**: Nhấn "Tạo nhân viên"

## Validation Rules

### Thông tin cơ bản
- **Họ tên**: Bắt buộc, không được để trống
- **Email**: Bắt buộc, phải đúng định dạng email
- **Số điện thoại**: Bắt buộc, 10-11 chữ số
- **Vai trò**: Bắt buộc, phải chọn từ danh sách

### Thông tin chi tiết
- **Ngày sinh**: Bắt buộc
- **Giới tính**: Bắt buộc
- **Địa chỉ**: Bắt buộc
- **Chuyên môn**: Bắt buộc nếu vai trò là "Nha sĩ"

### Tài khoản
- **Mật khẩu**: 8-16 ký tự
- **Xác nhận mật khẩu**: Phải khớp với mật khẩu
- **OTP**: Bắt buộc, 6 chữ số

## API Endpoints

### Thêm nhân viên
```
POST /auth/register
```

### Lấy danh sách nhân viên
```
GET /user/all-staff?page=1&limit=10
```

### Lấy nhân viên theo vai trò
```
GET /user/by-role?role=dentist&page=1&limit=10
```

### Tìm kiếm nhân viên
```
GET /user/staff/search?fullName=John&page=1&limit=10
```

### Lấy thông tin nhân viên
```
GET /user/{userId}
```

### Cập nhật nhân viên
```
PUT /user/update/{userId}
```

### Xóa nhân viên
```
DELETE /user/{userId}
```

## Quyền hạn

- **Admin**: Có thể thêm, xem, chỉnh sửa, xóa tất cả nhân viên
- **Manager**: Có thể thêm, xem, chỉnh sửa nhân viên (trừ admin)
- **Các vai trò khác**: Chỉ có thể xem thông tin của chính mình

## Tính năng đặc biệt

### Tự động sinh mã nhân viên
Hệ thống tự động tạo mã nhân viên theo format:
- Prefix theo vai trò (A, M, D, N, R)
- Số thứ tự 7 chữ số (0000001, 0000002...)

### OTP Verification
- Gửi OTP qua email khi tạo tài khoản
- OTP có thời hạn 5 phút
- Phải xác thực OTP trước khi tạo tài khoản

### Soft Delete
- Nhân viên có lịch sử trong hệ thống sẽ được soft delete
- Nhân viên chưa có lịch sử sẽ được hard delete

## Lưu ý

1. **Email duy nhất**: Mỗi email chỉ có thể được sử dụng cho một tài khoản
2. **Số điện thoại duy nhất**: Mỗi số điện thoại chỉ có thể được sử dụng cho một tài khoản
3. **Chuyên môn**: Chỉ hiển thị cho vai trò "Nha sĩ"
4. **Chứng chỉ**: Chỉ nha sĩ mới có thể upload và quản lý chứng chỉ
5. **Cache**: Hệ thống sử dụng Redis cache để tối ưu hiệu suất

## Troubleshooting

### Lỗi thường gặp

1. **"Email đã được sử dụng"**: Email này đã tồn tại trong hệ thống
2. **"Số điện thoại đã được sử dụng"**: Số điện thoại này đã tồn tại trong hệ thống
3. **"Mã OTP không hợp lệ"**: OTP sai hoặc đã hết hạn
4. **"Mật khẩu xác nhận không khớp"**: Hai trường mật khẩu không giống nhau

### Giải pháp

1. Kiểm tra lại email/số điện thoại
2. Gửi lại OTP nếu cần
3. Đảm bảo mật khẩu và xác nhận mật khẩu giống nhau
4. Kiểm tra kết nối mạng và thử lại
