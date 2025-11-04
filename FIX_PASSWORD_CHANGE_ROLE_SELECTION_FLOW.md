# FIX: Password Change → Role Selection Flow UI

## 🐛 Problem Report
**Issue**: When staff with multiple roles complete password change after first login:
- Backend returns correct response with `requiresRoleSelection: true`
- Console shows: `"message": "Đổi mật khẩu thành công. Vui lòng chọn vai trò đăng nhập."`
- BUT frontend shows error "Đổi mật khẩu thất bại"
- Role selection modal doesn't open

## 🔍 Root Cause Analysis

### Backend Response Structure
When multi-role user changes password:
```json
{
  "message": "Đổi mật khẩu thành công. Vui lòng chọn vai trò đăng nhập.",
  "pendingData": {
    "requiresRoleSelection": true,
    "roles": ["manager", "dentist", "nurse", "receptionist"],
    "userId": "...",
    "tempToken": "...",
    "user": { ... }
  }
}
```

**NO `accessToken` or `refreshToken` in this case!**

### Frontend Issues

#### Issue 1: authService.js (Line 282)
```javascript
// ❌ BEFORE: Always tries to destructure tokens
const { accessToken, refreshToken, user } = response.data;
localStorage.setItem('accessToken', accessToken); // ❌ undefined!
```

**Problem**: Code assumes response always contains tokens, but multi-role response has `pendingData` instead.

#### Issue 2: Login.jsx (Line 211)
```javascript
// ❌ BEFORE: Always completes login and navigates
toast.success('Đổi mật khẩu thành công!');
completeLogin(result.user); // ❌ result.user is undefined!
navigate(redirectPath); // ❌ Wrong flow!
```

**Problem**: Doesn't check for `requiresRoleSelection`, tries to login without tokens.

## ✅ Solution Implemented

### 1. Fixed authService.js
**File**: `src/services/authService.js`
**Lines**: 273-301

```javascript
completePasswordChange: async (tempToken, newPassword, confirmPassword) => {
  const response = await authApi.post('/auth/complete-password-change', {
    tempToken,
    newPassword,
    confirmPassword
  });
  
  // ✅ NEW: Check if role selection is required
  if (response.data.pendingData?.requiresRoleSelection) {
    console.log('🔄 [authService] Role selection required');
    return response.data; // Return full response with pendingData
  }
  
  // ✅ Only save tokens if single role user
  const { accessToken, refreshToken, user } = response.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  
  return response.data;
}
```

**Changes**:
- ✅ Check for `pendingData.requiresRoleSelection` BEFORE trying to access tokens
- ✅ Return full response if role selection needed
- ✅ Only save tokens for single-role users

### 2. Fixed Login.jsx
**File**: `src/components/Auth/Login.jsx`
**Lines**: 198-252

```javascript
const handlePasswordChange = async (values) => {
  try {
    const result = await authService.completePasswordChange(
      tempLoginData.tempToken,
      values.newPassword,
      values.confirmPassword
    );
    
    toast.success('Đổi mật khẩu thành công!');
    
    // ✅ NEW: Check if role selection is required
    if (result.pendingData?.requiresRoleSelection) {
      console.log('🔄 [Login] Role selection required:', result.pendingData);
      
      // Close password change modal
      setShowPasswordChangeModal(false);
      passwordChangeForm.resetFields();
      
      // Update tempLoginData with new data
      setTempLoginData({
        ...tempLoginData,
        tempToken: result.pendingData.tempToken,
        roles: result.pendingData.roles,
        userId: result.pendingData.userId,
        user: result.pendingData.user
      });
      
      // Show role selection modal
      setShowRoleSelectionModal(true);
      return; // ✅ Stop here, don't navigate
    }
    
    // ✅ Only for single-role users: complete login
    completeLogin(result.user);
    navigate(redirectPath);
    
  } catch (error) {
    toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
  }
};
```

**Changes**:
- ✅ Check for `result.pendingData?.requiresRoleSelection`
- ✅ If true: Update `tempLoginData` with new tempToken and show role modal
- ✅ If false: Complete login as before
- ✅ Prevent navigation when role selection needed

## 🔄 Complete Flow Now

### Step 1: Staff First Login
```
Login with employeeCode password
→ Shows "Đổi mật khẩu" modal
```

### Step 2: Staff Changes Password
```
POST /api/auth/complete-password-change
→ Backend response:
  - If single role: { accessToken, refreshToken, user }
  - If multi-role: { pendingData: { requiresRoleSelection, roles, tempToken } }
```

### Step 3a: Single Role User
```javascript
authService: Saves tokens to localStorage
Login.jsx: Calls completeLogin() → navigate()
Result: ✅ Login complete
```

### Step 3b: Multi-Role User (FIXED!)
```javascript
authService: Returns response with pendingData (no token save)
Login.jsx: 
  1. Detects requiresRoleSelection
  2. Closes password modal
  3. Updates tempLoginData with new tempToken
  4. Opens role selection modal ✅
Result: ✅ Shows role selection modal
```

### Step 4: Select Role (Multi-Role Only)
```
POST /api/auth/complete-role-selection
→ Returns: { accessToken, refreshToken, user }
→ Saves tokens and completes login ✅
```

## 🎯 Testing Checklist

- [ ] **Single Role User**:
  - [ ] Login with default password → Shows password modal
  - [ ] Change password → Automatically completes login
  - [ ] Redirects to dashboard

- [ ] **Multi-Role User**:
  - [ ] Login with default password → Shows password modal
  - [ ] Change password → Shows "Đổi mật khẩu thành công!"
  - [ ] Password modal closes
  - [ ] Role selection modal opens immediately ✅
  - [ ] Select role → Completes login with tokens
  - [ ] Redirects to dashboard

- [ ] **Error Cases**:
  - [ ] Password == employeeCode → Shows error
  - [ ] Password < 8 chars → Shows error
  - [ ] Invalid tempToken → Shows error

## 📌 Related Files

- `SmileDental-FE-new/src/services/authService.js:273-301` - Token save logic
- `SmileDental-FE-new/src/components/Auth/Login.jsx:198-252` - Password change handler
- `BE_KLTN/services/auth-service/src/services/auth.service.js:343-389` - Backend password change

## 🔗 Related Backend Fix

See: `BE_KLTN_TrungNghia_ThuTram/services/auth-service/FIX_FIRST_LOGIN_FLOW.md`
