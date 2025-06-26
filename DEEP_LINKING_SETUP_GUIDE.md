# 🔗 Hướng dẫn thiết lập Deep Linking cho Email xác nhận tiêm chủng

## 📋 Tổng quan

Hệ thống deep linking cho phép người dùng click vào link xác nhận trong email và được chuyển trực tiếp đến ứng dụng mobile thay vì web browser.

## 🛠️ Cấu hình hiện tại

### ✅ Mobile App (Đã hoàn thành)

1. **App scheme**: `schoolmedical://` (đã cấu hình trong `app.json`)
2. **DeepLinkHandler**: Đã tích hợp trong `app/_layout.tsx`
3. **Route handlers**:
   - `vaccine-registration` → Trang xác nhận tiêm chủng
   - `medical-check-registration` → Trang xác nhận khám sức khỏe
4. **Parameters**: `registrationId`, `eventId`, `studentId`, `parentId`

### ❌ Backend (Cần cập nhật)

## 🚀 Triển khai Backend

### 1. **Cập nhật Email Template**

**Thay đổi từ:**

```html
<a
  href="http://localhost:3000/vaccine-registration?registrationId=123&eventId=456"
>
  Xác nhận tiêm chủng
</a>
```

**Thành:**

**Cho Vaccine Registration:**

```html
<!-- Primary button: App deep link -->
<a
  href="schoolmedical://vaccine-registration?registrationId={{registrationId}}&eventId={{eventId}}&studentId={{studentId}}&parentId={{parentId}}"
>
  📱 Mở ứng dụng - Xác nhận tiêm chủng
</a>

<!-- Fallback button: Web version -->
<a
  href="https://yourapp.com/vaccine-registration-web?registrationId={{registrationId}}&eventId={{eventId}}"
>
  🌐 Xem trên trình duyệt
</a>
```

**Cho Medical Check Registration:**

```html
<!-- Primary button: App deep link -->
<a
  href="schoolmedical://medical-check-registration?registrationId={{registrationId}}&eventId={{eventId}}&studentId={{studentId}}&parentId={{parentId}}"
>
  📱 Mở ứng dụng - Xác nhận khám sức khỏe
</a>

<!-- Fallback button: Web version -->
<a
  href="https://yourapp.com/medical-check-registration-web?registrationId={{registrationId}}&eventId={{eventId}}"
>
  🌐 Xem trên trình duyệt
</a>
```

### 2. **Tạo Web Fallback Route**

Tạo route `/vaccine-registration-web` để xử lý trường hợp user không có app:

```javascript
// Backend route example (Node.js/Express)
app.get("/vaccine-registration-web", async (req, res) => {
  const { registrationId, eventId } = req.query;

  // Validate parameters
  if (!registrationId || !eventId) {
    return res.status(400).send("Missing required parameters");
  }

  // Get registration data
  const registration = await getVaccineRegistration(registrationId);
  const event = await getVaccineEvent(eventId);

  // Render fallback page with auto-redirect attempt
  res.render("vaccine-registration-fallback", {
    registrationId,
    eventId,
    registration,
    event,
    appUrl: `schoolmedical://vaccine-registration?registrationId=${registrationId}&eventId=${eventId}`,
  });
});
```

### 3. **Email Service Update**

Cập nhật service gửi email:

```javascript
// Email template data
const emailData = {
  to: parent.email,
  subject: "Xác nhận tiêm chủng - School Medical",
  template: "vaccine-confirmation",
  data: {
    registrationId: registration._id,
    eventId: event._id,
    studentId: student._id,
    parentId: parent._id,
    studentName: student.fullName,
    vaccineName: event.vaccineName,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    confirmationDeadline: event.confirmationDeadline,
    webUrl: process.env.WEB_BASE_URL, // e.g., https://yourapp.com
  },
};

await emailService.send(emailData);
```

## 📱 Test Deep Linking

### 1. **Test trên Development**

```bash
# Test Vaccine Registration
# Android
adb shell am start -W -a android.intent.action.VIEW -d "schoolmedical://vaccine-registration?registrationId=123&eventId=456" com.yourcompany.schoolmedical

# iOS Simulator
xcrun simctl openurl booted "schoolmedical://vaccine-registration?registrationId=123&eventId=456"

# Test Medical Check Registration
# Android
adb shell am start -W -a android.intent.action.VIEW -d "schoolmedical://medical-check-registration?registrationId=789&eventId=101" com.yourcompany.schoolmedical

# iOS Simulator
xcrun simctl openurl booted "schoolmedical://medical-check-registration?registrationId=789&eventId=101"
```

### 2. **Test trên Device**

1. Gửi email test với real deep link
2. Mở email trên mobile device
3. Click vào button "Mở ứng dụng School Medical"
4. Verify app mở đúng trang registration

### 3. **Test Console Debug**

Trong React Native debugger console:

```javascript
// Test vaccine registration
testDeepLink(
  "schoolmedical://vaccine-registration?registrationId=123&eventId=456"
);

// Test medical check registration
testDeepLink(
  "schoolmedical://medical-check-registration?registrationId=789&eventId=101"
);
```

## 🔧 Troubleshooting

### Vấn đề: Deep link không hoạt động

**Nguyên nhân có thể:**

1. App chưa được install
2. App scheme không đúng
3. URL format sai
4. Parameters missing

**Giải pháp:**

1. Kiểm tra app.json scheme
2. Verify URL encoding
3. Check console logs
4. Test với adb/simctl

### Vấn đề: Parameters không được truyền

**Kiểm tra:**

1. URL có encode đúng không
2. DeepLinkHandler có parse được không
3. Registration page có nhận được params không

**Debug steps:**

1. Check console logs trong DeepLinkHandler
2. Verify useLocalSearchParams() trong registration page
3. Test với manual URL

## 🎯 Best Practices

### 1. **Email Design**

- ✅ Primary button: App deep link
- ✅ Secondary button: Web fallback
- ✅ Clear instructions for app download
- ✅ Manual copy-paste link option

### 2. **Error Handling**

- ✅ Graceful fallback khi app không mở được
- ✅ Clear error messages
- ✅ Alternative options cho user

### 3. **User Experience**

- ✅ Auto-detect và redirect
- ✅ Loading states
- ✅ Clear navigation
- ✅ Confirmation messages

### 4. **Security**

- ✅ Validate parameters
- ✅ Check registration ownership
- ✅ Secure token if needed
- ✅ Rate limiting

## 📊 Analytics & Monitoring

Track các metrics sau:

1. **Email metrics:**

   - Email open rate
   - Button click rate
   - App vs web ratio

2. **Deep link metrics:**

   - Deep link success rate
   - Fallback usage rate
   - Error rates by type

3. **Conversion metrics:**
   - Confirmation completion rate
   - Time from email to confirmation
   - User journey analysis

## 🚀 Production Deployment

### 1. **App Store Setup**

Đảm bảo app đã được publish trên:

- 📱 Apple App Store
- 🤖 Google Play Store

### 2. **Domain Setup**

Cấu hình universal links (optional):

- iOS: Associated Domains
- Android: App Links

### 3. **Email Template Final**

```html
<!-- Use template provided in email-template-example.html -->
```

### 4. **Backend Environment**

```env
WEB_BASE_URL=https://yourapp.com
APP_SCHEME=schoolmedical
EMAIL_TEMPLATE_PATH=/templates/vaccine-confirmation.html
```

## 🔗 Related Files

- `app.json` - App configuration
- `components/DeepLinkHandler.tsx` - Deep link handler
- `app/_layout.tsx` - Root layout with handler
- `app/(tabs)/(parent)/vaccinations/registration.tsx` - Vaccine registration page
- `app/medical-check-registration.tsx` - Medical check registration page
- `lib/api.ts` - API service with medical check methods
- `test-deep-linking.md` - Testing guide

## ✅ Checklist

**Backend Tasks:**

- [ ] Cập nhật email template với app scheme links
- [ ] Tạo web fallback route
- [ ] Test email với real device
- [ ] Deploy lên production

**Mobile Tasks:**

- [x] Deep link handler đã setup
- [x] Registration page handle parameters
- [x] Testing framework ready
- [ ] Test với production emails

**QA Tasks:**

- [ ] Test trên iOS device
- [ ] Test trên Android device
- [ ] Test fallback scenarios
- [ ] Test với different email clients
- [ ] Performance testing

---

**📞 Support:** Nếu có vấn đề gì, check console logs và tham khảo `test-deep-linking.md` để debug.
