# 🔗 Test Deep Linking cho Vaccine Registration

## 📱 **Các URL được hỗ trợ:**

1. **App Scheme**: `schoolmedical://vaccine-registration?registrationId=123&eventId=456`
2. **HTTP**: `http://localhost:3000/vaccine-registration?registrationId=123&eventId=456`
3. **HTTPS**: `https://yourapp.com/vaccine-registration?registrationId=123&eventId=456`

## 🧪 **Cách test:**

### **1. Test trên Android Simulator:**

```bash
adb shell am start -W -a android.intent.action.VIEW -d "schoolmedical://vaccine-registration?registrationId=123&eventId=456" com.yourcompany.schoolmedical
```

### **2. Test trên iOS Simulator:**

```bash
xcrun simctl openurl booted "schoolmedical://vaccine-registration?registrationId=123&eventId=456"
```

### **3. Test trong Development Console:**

Mở React Native debugger và chạy:

```javascript
// Trong console
testDeepLink(
  "schoolmedical://vaccine-registration?registrationId=123&eventId=456"
);
```

### **4. Test từ Browser (Web):**

Mở browser và truy cập:

```
http://localhost:3000/vaccine-registration?registrationId=123&eventId=456
```

### **5. Test Manual trong App:**

```javascript
// Trong component nào đó, thêm button test
import * as Linking from "expo-linking";

const testDeepLink = () => {
  const testUrl =
    "schoolmedical://vaccine-registration?registrationId=123&eventId=456";
  Linking.openURL(testUrl);
};
```

## 🔍 **Debug Deep Linking:**

### **1. Check Console Logs:**

Khi click vào link, bạn sẽ thấy logs:

```
🔗 Deep link received: schoolmedical://vaccine-registration?registrationId=123&eventId=456
🔍 Parsed URL: {url: "...", hostname: "vaccine-registration", ...}
💉 Processing vaccine registration deep link
📋 Extracted parameters: {registrationId: "123", eventId: "456"}
🚀 Navigating to route: /(tabs)/(parent)/vaccinations/registration?registrationId=123&eventId=456
✅ Navigation successful
```

### **2. Check Parameters trong Registration Page:**

Trong `registration.tsx`, parameters sẽ được log:

```
📋 Loading vaccine registration data...
Parameters: {eventId: "456", registrationId: "123", studentId: undefined, parentId: undefined}
```

## 🚀 **Production Setup:**

### **1. Update app.json cho production:**

```json
{
  "expo": {
    "linking": {
      "prefixes": [
        "schoolmedical://",
        "https://schoolmedical.app",
        "https://yourapp.com"
      ]
    }
  }
}
```

### **2. Backend Email Template:**

```html
<div style="text-align: center; padding: 20px;">
  <h2>🏥 Xác nhận tiêm chủng</h2>
  <p>Vui lòng click vào nút bên dưới để xác nhận tiêm chủng cho con em:</p>

  <!-- Mobile App Link (Primary) -->
  <a
    href="schoolmedical://vaccine-registration?registrationId={{registrationId}}&eventId={{eventId}}"
    style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; text-decoration: none; border-radius: 10px; margin: 10px;"
  >
    📱 Mở ứng dụng School Medical
  </a>

  <!-- Web Fallback -->
  <br />
  <a
    href="https://yourapp.com/vaccine-registration?registrationId={{registrationId}}&eventId={{eventId}}"
    style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 5px;"
  >
    🌐 Xem trên web
  </a>

  <p style="font-size: 12px; color: #999; margin-top: 20px;">
    Nếu không mở được ứng dụng, vui lòng copy link sau vào trình duyệt:<br />
    <code
      >https://yourapp.com/vaccine-registration?registrationId={{registrationId}}&eventId={{eventId}}</code
    >
  </p>
</div>
```

## ⚠️ **Troubleshooting:**

### **Vấn đề 1: Link không mở app**

- Kiểm tra app scheme trong `app.json`
- Đảm bảo app đã được install
- Test với `adb` hoặc `xcrun simctl`

### **Vấn đề 2: Parameters không được truyền**

- Check console logs để xem URL parsing
- Kiểm tra format URL có đúng không
- Đảm bảo parameters được encode đúng

### **Vấn đề 3: Navigation không hoạt động**

- Kiểm tra route path có đúng không
- Đảm bảo page registration tồn tại
- Check router initialization

### **Vấn đề 4: Web link mở browser thay vì app**

- Cần implement backend redirect (như example trên)
- Hoặc sử dụng Universal Links (iOS) / App Links (Android)

## 🎯 **Best Practices:**

1. **Always provide fallback**: Web version cho khi app không mở được
2. **User-friendly messages**: Thông báo rõ ràng khi có lỗi
3. **Parameter validation**: Kiểm tra parameters trước khi xử lý
4. **Error handling**: Xử lý gracefully khi có lỗi
5. **Testing**: Test trên cả iOS và Android
6. **Analytics**: Track deep link usage để optimize

## 📊 **Metrics to Track:**

- Deep link click rate từ email
- Success rate mở app
- Fallback to web rate
- Conversion rate (consent completion)
- Error rates và types
