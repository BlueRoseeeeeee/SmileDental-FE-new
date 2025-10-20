# 🎨 Price Schedule UI Visual Guide

## 📸 UI Screenshots & Layout Description

### 1. Service List View
```
┌─────────────────────────────────────────────────────────────────────┐
│  STT │ Tên dịch vụ        │ Giá dịch vụ          │ Loại  │ Thao tác │
├─────────────────────────────────────────────────────────────────────┤
│  1   │ Nhổ răng khôn      │ 450,000đ - 800,000đ │ Điều  │  👁 ✏ 🗑  │
│      │                    │ 🎉 Khuyến mãi        │ trị   │          │
├─────────────────────────────────────────────────────────────────────┤
│  2   │ Trám răng sâu      │ 200,000đ - 500,000đ │ Điều  │  👁 ✏ 🗑  │
│      │                    │                      │ trị   │          │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Price displayed in **RED** when promotion active
- ✅ "🎉 Khuyến mãi" badge appears below price
- ✅ Uses `effectivePrice` instead of base price
- ✅ Visual distinction between normal and promotional pricing

---

### 2. Service Details - Add-Ons Table
```
┌────────────────────────────────────────────────────────────────────────────┐
│ STT │ Tên cấp độ          │ Mô tả         │ Giá              │ Thao tác    │
├────────────────────────────────────────────────────────────────────────────┤
│ 1   │ Nhổ răng đơn giản  │ Răng thường   │ 500,000đ         │ 💰 ✏ 🔘 🗑  │
│     │                    │               │ 450,000đ 🎉 KM   │             │
├────────────────────────────────────────────────────────────────────────────┤
│ 2   │ Nhổ răng phức tạp  │ Răng mọc lệch │ 800,000đ         │ 💰 ✏ 🔘 🗑  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Price Column Layout:**
```
┌─────────────────────┐
│  500,000đ           │  ← Strike-through, gray, 12px (base price)
│  450,000đ  🎉 KM    │  ← Bold, red, 16px (effective price + badge)
└─────────────────────┘
```

**New Button:**
- 💰 Icon: `<DollarOutlined />` - "Quản lý giá"
- Position: First button (before Edit)
- Click: Opens Price Schedule Management Modal

---

### 3. Price Schedule Management Modal
```
┌───────────────────────────────────────────────────────────────────────────┐
│  Quản lý lịch giá - Nhổ răng đơn giản                                [×] │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Giá gốc: 500,000đ    Giá hiệu lực: 450,000đ    🎉 Đang khuyến mãi      │
│                                                                           │
│  [+ Thêm lịch giá mới]                                                   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Giá áp dụng │ Ngày bắt đầu │ Ngày KT    │ Trạng thái │ Ghi chú  │ ⚙ │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ 450,000đ    │ 01/01/2024   │ 31/01/2024 │ Đang áp dụng│ Tết     │✏🔘🗑│ │
│  │ 480,000đ    │ 01/02/2024   │ 29/02/2024 │ Tạm ngưng   │ Tháng 2 │✏🔘🗑│ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│                                               [Đóng]                      │
└───────────────────────────────────────────────────────────────────────────┘
```

**Modal Features:**
- Width: 900px
- Shows base price vs effective price comparison
- Table with all schedules
- Actions per schedule: Edit (✏), Toggle (🔘), Delete (🗑)
- Add button to create new schedule

---

### 4. Add/Edit Price Schedule Form
```
┌───────────────────────────────────────────────────────────────────────────┐
│  Thêm lịch giá mới                                                    [×] │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Giá áp dụng (VNĐ) *                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 450,000                                                              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Ngày bắt đầu *              Ngày kết thúc *                             │
│  ┌────────────────────────┐  ┌────────────────────────┐                 │
│  │ 01/01/2024        📅   │  │ 31/01/2024        📅   │                 │
│  └────────────────────────┘  └────────────────────────┘                 │
│                                                                           │
│  Ghi chú                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Khuyến mãi Tết Nguyên Đán 2024                           0/500      │ │
│  │                                                                      │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Trạng thái                                                               │
│  [ Đang áp dụng / Tạm ngưng ]  ← Switch toggle                           │
│                                                                           │
│                                               [Hủy]  [Thêm]              │
└───────────────────────────────────────────────────────────────────────────┘
```

**Form Fields:**
1. **Giá áp dụng**: Number input with thousand separator (1,000,000)
2. **Ngày bắt đầu**: DatePicker with DD/MM/YYYY format
3. **Ngày kết thúc**: DatePicker with validation (must be > start date)
4. **Ghi chú**: TextArea with character count (max 500)
5. **Trạng thái**: Switch (default: Đang áp dụng)

**Validation:**
- Required fields marked with *
- Price must be >= 0
- End date must be after start date
- Note max 500 characters

---

## 🎨 Color Codes

### Text Colors:
```css
Normal Price:       #52c41a  /* Green */
Promotion Price:    #ff4d4f  /* Red */
Base Price (sale):  #666666  /* Gray, strike-through */
Secondary Text:     #666666  /* Gray */
```

### Tag Colors:
```css
Promotion Badge:    red tag   /* "🎉 Khuyến mãi" or "🎉 KM" */
Active Status:      green tag /* "Đang áp dụng" */
Inactive Status:    red tag   /* "Tạm ngưng" */
Service Type:       green tag /* "Điều trị", "Khám" */
```

### Button Colors:
```css
Primary Button:     #1890ff  /* Blue - Add button */
Text Button:        transparent with icon
Danger Button:      #ff4d4f  /* Red - Delete */
```

---

## 📏 Spacing & Sizing

### Font Sizes:
```css
Normal Price:       14px, bold
Promotion Price:    16px, bold
Base Price (sale):  12px, strike-through
Badge Text:         10px
Table Text:         14px
```

### Component Sizes:
```css
Table:              size="small"
Button:             size="small"
Modal (Management): width="900px"
Modal (Add/Edit):   width="600px"
Input:              width="100%" (inside form)
```

### Margins & Padding:
```css
Badge margin-top:   4px
Badge margin-left:  8px
Form item spacing:  16px vertical
Modal padding:      24px
Table row padding:  8px
```

---

## 🔄 State Indicators

### Price Display States:

**1. Normal Price (No Promotion):**
```
500,000đ
```
- Color: Green (#52c41a)
- Font: Bold, 14px
- No badge

**2. Promotional Price (Active Schedule):**
```
500,000đ  ← Strike-through, gray, 12px
450,000đ 🎉 KM  ← Bold, red, 16px + badge
```
- Base price: Strike-through, gray
- Effective price: Red, larger font
- Badge: "🎉 KM" in red tag

**3. Service List (Has Promotion):**
```
450,000đ - 800,000đ  ← Red color
🎉 Khuyến mãi        ← Badge below
```
- Price range in red
- Badge on separate line

---

### Schedule Status Display:

**Active Schedule:**
```
[Đang áp dụng]  ← Green tag
```

**Inactive Schedule:**
```
[Tạm ngưng]  ← Red tag
```

---

## 🎯 Interactive Elements

### Buttons:

**1. Quản lý giá (Manage Price):**
```
[💰]  ← DollarOutlined icon, text button
```
- Click: Opens management modal
- Tooltip: "Quản lý giá"

**2. Thêm lịch giá (Add Schedule):**
```
[+ Thêm lịch giá mới]  ← Primary button with PlusOutlined
```
- Click: Opens add form modal

**3. Edit Schedule:**
```
[✏]  ← EditOutlined icon, text button
```
- Click: Opens edit form with pre-filled data

**4. Delete Schedule:**
```
[🗑]  ← DeleteOutlined icon, danger text button
```
- Click: Shows Popconfirm
- Confirm: Deletes schedule

**5. Toggle Status:**
```
[🔘]  ← Switch component, small size
```
- Click: Toggles isActive status
- Visual feedback: Immediate switch

---

### Popconfirm (Delete):
```
┌─────────────────────────────────────┐
│ Xác nhận xóa lịch giá?              │
│ Hành động này không thể hoàn tác!   │
│                                     │
│              [Hủy]  [Xóa]          │
└─────────────────────────────────────┘
```

---

## 📱 Responsive Behavior

### Desktop (> 1200px):
- Full width modals
- All columns visible
- Side-by-side date pickers

### Tablet (768px - 1200px):
- Slightly narrower modals
- All features remain
- Table scrolls horizontally if needed

### Mobile (< 768px):
- Stack date pickers vertically
- Smaller modal padding
- Table in scroll container
- Full-width buttons

---

## ⚡ Animations & Transitions

### Modal Open/Close:
```css
animation: slide-fade-in 0.3s ease-out
```

### Tag Appearance:
```css
animation: fade-in 0.2s ease-in
```

### Switch Toggle:
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### Button Hover:
```css
transition: color 0.3s, background 0.3s
```

---

## 🎭 User Interactions

### Flow 1: View Services with Promotions
```
List View
   ↓
See red price + badge
   ↓
Click "View Details"
   ↓
See strike-through price + effective price
```

### Flow 2: Add Price Schedule
```
Service Details
   ↓
Click 💰 button
   ↓
Management modal opens
   ↓
Click "+ Thêm lịch giá mới"
   ↓
Fill form
   ↓
Click "Thêm"
   ↓
Success toast
   ↓
Modal refreshes
   ↓
Price updates in table
```

### Flow 3: Edit Price Schedule
```
Management modal
   ↓
Click ✏ on schedule
   ↓
Form opens with data
   ↓
Modify fields
   ↓
Click "Cập nhật"
   ↓
Success toast
   ↓
Changes reflected
```

### Flow 4: Toggle Schedule
```
Management modal
   ↓
Click switch 🔘
   ↓
Status toggles immediately
   ↓
Success toast
   ↓
Effective price updates if needed
```

---

## 🎨 CSS Classes Reference

### Custom Styles Applied:

```jsx
// Strike-through price
<Text 
  delete 
  type="secondary" 
  style={{ fontSize: 12 }}
>

// Promotion price
<Text 
  strong 
  style={{ color: '#ff4d4f', fontSize: 16 }}
>

// Normal price
<Text 
  strong 
  style={{ color: '#52c41a' }}
>

// Promotion badge
<Tag 
  color="red" 
  style={{ fontSize: 10 }}
>
  🎉 KM
</Tag>

// Price display container
<div style={{ marginTop: 4 }}>
```

---

## 📐 Layout Measurements

### Service List Table:
```
Column Widths:
- STT:          60px
- Tên dịch vụ:  150px
- Giá dịch vụ:  180px  ← Increased for badge
- Loại:         100px
- Trạng thái:   120px
- Tùy chọn:     120px
- Thao tác:     280px
```

### Service Details Table:
```
Column Widths:
- STT:          60px
- Tên cấp độ:   auto
- Mô tả:        auto
- Giá:          200px  ← Increased for promotion display
- Trạng thái:   auto
- Thao tác:     220px  ← Increased for manage button
```

### Price Schedule Table:
```
Column Widths:
- Giá áp dụng:  120px
- Ngày bắt đầu: 120px
- Ngày KT:      120px
- Trạng thái:   120px
- Ghi chú:      auto
- Thao tác:     150px
```

---

## 🎉 Success States

### After Adding Schedule:
```
✅ Toast Message: "Thêm lịch giá thành công!"
→ Management modal refreshes
→ New schedule appears in table
→ Effective price updates
```

### After Editing Schedule:
```
✅ Toast Message: "Cập nhật lịch giá thành công!"
→ Management modal refreshes
→ Schedule updates in table
→ Effective price recalculates
```

### After Deleting Schedule:
```
✅ Toast Message: "Xóa lịch giá thành công!"
→ Schedule removed from table
→ Effective price reverts to base
```

### After Toggling Status:
```
✅ Toast Message: "Cập nhật trạng thái lịch giá thành công!"
→ Tag updates (green/red)
→ Effective price updates
```

---

## 🎨 Complete Visual Example

### Service Details Page Layout:
```
┌──────────────────────────────────────────────────────────────────────┐
│  [← Quay lại]  Chi tiết dịch vụ                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────┐  ┌──────────────────────────────────┐  │
│  │ Thông tin dịch vụ      │  │ Thống kê                        │  │
│  │ Tên: Nhổ răng khôn     │  │ Tổng cấp độ: 3                  │  │
│  │ Loại: Điều trị         │  │ Giá: 450,000đ - 800,000đ        │  │
│  │ ✅ Hoạt động           │  │                                  │  │
│  └────────────────────────┘  └──────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Các cấp độ dịch vụ                    [+ Thêm cấp độ mới]   │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ STT│ Tên         │ Mô tả │ Giá          │ Trạng thái│ Thao tác│  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 1  │ Đơn giản    │ ...   │ 500,000đ    │ ✅ Hoạt   │💰✏🔘🗑 │  │
│  │    │             │       │ 450,000đ 🎉 │  động     │       │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 2  │ Trung bình  │ ...   │ 650,000đ    │ ✅ Hoạt   │💰✏🔘🗑 │  │
│  │    │             │       │             │  động     │       │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 3  │ Phức tạp    │ ...   │ 800,000đ    │ ✅ Hoạt   │💰✏🔘🗑 │  │
│  │    │             │       │             │  động     │       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

**🎨 UI Visual Guide Complete!**

This guide provides a complete visual reference for the Price Schedule Management UI implementation.
