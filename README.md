# 🔐 BlockCert – Xác Thực Chứng Chỉ Blockchain

Đồ án môn Blockchain – Nhóm 6  
Hệ thống cấp và xác thực chứng chỉ học tập trên nền tảng **Ethereum Blockchain + IPFS + Firebase**.

---

## 🗂️ Cấu Trúc Thư Mục

```
Blockchain_Nhom6/
├── contracts/
│   └── Certificate.sol          # Smart contract Solidity (có chú thích tiếng Việt)
├── scripts/
│   └── deploy.js                # Deploy + tự động cập nhật config.js
├── test/
│   └── Certificate.test.js      # Unit tests
├── frontend/
│   ├── css/style.css            # Dark theme + glassmorphism
│   ├── js/
│   │   ├── config.js            # ABI + địa chỉ contract + Pinata config
│   │   ├── utils.js             # SHA-256, IPFS upload, QR, Toast
│   │   ├── app.js               # MetaMask, ethers.js, DOM logic
│   │   └── firebase-config.js   # Firebase Auth + Firestore (ES Module)
│   ├── index.html               # Trang chủ (Landing page)
│   ├── login.html               # 🆕 Trang đăng nhập (Google + MetaMask)
│   ├── user.html                # 🆕 Ví chứng chỉ cá nhân (User dashboard)
│   ├── admin.html               # Quản trị Admin (cấp/thu hồi chứng chỉ)
│   └── verify.html              # Xác thực chứng chỉ (công khai)
├── hardhat.config.js
├── .env.example
├── package.json
└── README.md                    # 📖 File này
```

---

## 📚 Công Nghệ Sử Dụng

| Layer | Công nghệ |
|-------|-----------|
| Blockchain | Ethereum (EVM), Solidity 0.8.20 |
| Dev tools | Hardhat v2, Mocha, Chai |
| Frontend | HTML5, CSS3 thuần, Vanilla JS |
| Thư viện | ethers.js v6, CryptoJS, html5-qrcode, QRCode.js |
| Storage | IPFS qua Pinata API |
| Auth | Firebase Authentication (Google Sign-In) |
| Database | Cloud Firestore (Firebase) |
| Mã băm | SHA-256 |

---

## 🔑 Vai Trò Trong Hệ Thống

| Vai trò | Đăng nhập bằng | Quyền hạn |
|---------|----------------|-----------|
| **Admin** | 🦊 MetaMask (ví đã deploy contract) | Cấp chứng chỉ, thu hồi, tạo QR |
| **User/Sinh viên** | 🔑 Google (Firebase Auth) | Xem ví chứng chỉ, nhập mã CC |
| **Khách** | Không cần đăng nhập | Xác thực chứng chỉ công khai |

---

## ⚡ HƯỚNG DẪN CHẠY DEMO CHI TIẾT (FULL)

### 📋 Yêu Cầu Trước Khi Bắt Đầu

| Yêu cầu | Cách kiểm tra | Link tải |
|----------|---------------|----------|
| Node.js ≥ 18 | `node -v` | [nodejs.org](https://nodejs.org) |
| MetaMask Extension | Kiểm tra icon 🦊 trên trình duyệt | [metamask.io](https://metamask.io) |
| Trình duyệt Chrome/Edge/Brave | – | – |
| Tài khoản Google | Bất kỳ Gmail nào | – |

---

### 🚀 BƯỚC 1: Cài Đặt Dependencies

Mở Terminal tại thư mục dự án:

```bash
cd Blockchain_Nhom6
npm install
```

> ✅ Chờ đến khi xuất hiện `added ... packages`

---

### 🚀 BƯỚC 2: Khởi Chạy Blockchain Local (Hardhat Node)

```bash
npx hardhat node
```

**Kết quả:** Terminal sẽ in ra 20 tài khoản test, mỗi tài khoản có:
- **Address** (địa chỉ ví)
- **Private Key** (khóa bí mật)
- **10000 ETH** (tiền test)

> ⚠️ **QUAN TRỌNG:** Giữ terminal này MỞ LIÊN TỤC. Copy **Private Key** của tài khoản **Account #0** (tài khoản đầu tiên).

**Ví dụ output:**
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

### 🚀 BƯỚC 3: Deploy Smart Contract

Mở **terminal MỚI** (giữ terminal cũ đang chạy hardhat node):

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Kết quả mong đợi:**
```
=== Deploy Certificate Smart Contract ===
Admin address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Balance: 10000.0 ETH
✅ Contract deployed: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ config.js updated automatically
```

> ✅ Script tự động cập nhật địa chỉ contract vào `frontend/js/config.js`

---

### 🚀 BƯỚC 4: Cấu Hình MetaMask

#### 4.1 Thêm Mạng Hardhat Local

1. Mở MetaMask → Click vào tên mạng (góc trên) → **Add Network** → **Add a network manually**
2. Điền thông tin:

| Trường | Giá trị |
|--------|---------|
| Network Name | `Hardhat Local` |
| New RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

3. Nhấn **Save**

#### 4.2 Import Tài Khoản Admin

1. Mở MetaMask → Click icon tài khoản (góc trên phải) → **Import Account**
2. Chọn **Private Key**
3. Paste Private Key của **Account #0** từ Bước 2:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
4. Nhấn **Import**

> ✅ Tài khoản hiện có **~10000 ETH** (tiền test, không có giá trị thật)

#### 4.3 Kiểm Tra Kết Nối

- Đảm bảo MetaMask đang chọn mạng **Hardhat Local**
- Đảm bảo tài khoản hiện tại là **Account #0** (địa chỉ bắt đầu bằng `0xf39F...`)

---

### 🚀 BƯỚC 5: Cấu Hình Firebase (Đã Được Tích Hợp Sẵn)

Firebase đã được cấu hình sẵn trong `frontend/js/firebase-config.js`. Tuy nhiên, bạn cần đảm bảo:

#### 5.1 Bật Google Sign-In

1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Chọn project **blockchainnhom6**
3. Vào **Authentication** → **Sign-in method**
4. Bật **Google** → Chọn email hỗ trợ → **Save**

#### 5.2 Bật Cloud Firestore

1. Trong Firebase Console → **Firestore Database**
2. Nhấn **Create Database** (nếu chưa tạo)
3. Chọn **Start in test mode** (cho mục đích demo)
4. Chọn location → **Done**

#### 5.3 Security Rules (Test Mode)

Trong **Firestore → Rules**, đảm bảo có rule:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userCertificates/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

### 🚀 BƯỚC 6: Mở Frontend & Demo

Mở trực tiếp file HTML trong trình duyệt (hoặc dùng Live Server):

```
frontend/index.html      → Trang chủ
frontend/login.html      → Đăng nhập
frontend/admin.html      → Quản trị Admin
frontend/user.html       → Ví chứng chỉ User
frontend/verify.html     → Xác thực công khai
```

> 💡 **Khuyên dùng:** Cài extension **Live Server** trong VS Code → chuột phải file `index.html` → **Open with Live Server**

---

## 🎬 DEMO LUỒNG ADMIN (Cấp Chứng Chỉ)

### Bước A1: Đăng Nhập Admin

1. Mở `frontend/login.html`
2. Ở cột **"Quản Trị Viên"** → nhấn **"Đăng nhập bằng MetaMask"**
3. MetaMask popup → chọn tài khoản **Account #0** → **Connect**
4. Hệ thống kiểm tra quyền admin → ✅ Redirect sang `admin.html`

### Bước A2: Cấp Chứng Chỉ Mới

1. Tại `admin.html`, điền form **"Cấp Chứng Chỉ Mới"**:
   - **Mã chứng chỉ:** `CERT-2024-001`
   - **Tên người nhận:** `Nguyễn Văn A`
   - **File PDF:** Chọn bất kỳ file PDF nào

2. Nhấn **"🎓 Cấp Chứng Chỉ"**

3. Quy trình tự động chạy 4 bước:
   - Bước 1: Tính SHA-256 hash của file PDF
   - Bước 2: Upload file lên IPFS (Pinata)
   - Bước 3: Gửi giao dịch lên Blockchain
   - Bước 4: Chờ xác nhận từ Blockchain

4. MetaMask popup → nhấn **Confirm** để ký giao dịch

5. ✅ Chứng chỉ được cấp → QR Code được tạo

### Bước A3: Cấp Thêm Chứng Chỉ (Tùy Chọn)

Lặp lại bước A2 với các thông tin khác:
- `CERT-2024-002` – `Trần Thị B`
- `CERT-2024-003` – `Lê Văn C`

### Bước A4: Thu Hồi Chứng Chỉ (Tùy Chọn)

1. Tại danh sách chứng chỉ → nhấn **"🚫 Thu hồi"** bên cạnh chứng chỉ cần thu hồi
2. Xác nhận → MetaMask → Confirm
3. ✅ Trạng thái chuyển sang **"Đã thu hồi"**

---

## 🎬 DEMO LUỒNG USER (Nhập Chứng Chỉ Vào Ví)

### Bước U1: Đăng Nhập User

1. Mở `frontend/login.html`
2. Ở cột **"Sinh Viên / Người Dùng"** → nhấn **"Đăng nhập với Google"**
3. Popup Google → chọn tài khoản Gmail → Đăng nhập
4. ✅ Redirect sang `user.html` (Ví Chứng Chỉ)

### Bước U2: Nhập Chứng Chỉ Vào Ví

1. Nhấn **"➕ Nhập Chứng Chỉ"**
2. Nhập mã chứng chỉ đã được admin cấp: `CERT-2024-001`
3. Hệ thống tự động kiểm tra trên Blockchain:
   - Hiển thị thông tin chứng chỉ (tên, ngày cấp, trạng thái)
   - ✅ Lưu vào Firestore (ví cá nhân)

4. Lặp lại với các mã khác: `CERT-2024-002`, `CERT-2024-003`

### Bước U3: Xem Ví Chứng Chỉ

- Trang `user.html` hiển thị grid các card chứng chỉ đã lưu
- Mỗi card có: Mã CC, Tên, Ngày cấp, Trạng thái, Link IPFS
- Nhấn **"🔍 Xác thực"** để kiểm tra lại trên Blockchain
- Nhấn **"🗑️ Xóa khỏi ví"** để xóa khỏi ví cá nhân

### Bước U4: Đăng Xuất

- Nhấn nút **🚪** trên navbar → Đăng xuất khỏi Google → Quay về `login.html`

---

## 🎬 DEMO XÁC THỰC CÔNG KHAI

### Bước V1: Xác Thực Bằng Mã

1. Mở `frontend/verify.html`
2. Tab **"📋 Nhập mã"** → nhập `CERT-2024-001`
3. Nhấn **"🔍 Xác Thực"**
4. Kết quả: ✅ **CHỨNG CHỈ HỢP LỆ** (hoặc 🚫 Đã thu hồi / ❌ Không tìm thấy)

### Bước V2: Xác Thực Bằng File PDF

1. Tab **"📄 Upload PDF"** → chọn file PDF gốc
2. Hệ thống tính SHA-256 hash → so sánh với Blockchain
3. ✅ Nếu hash khớp → Hợp lệ

### Bước V3: Xác Thực Bằng QR Code

1. Tab **"📷 Quét QR"** → bật camera
2. Quét QR code từ admin → tự động xác thực

---

## 🎬 DEMO TRÊN REMIX IDE (https://remix.ethereum.org/)

> Remix IDE là công cụ trực tuyến để viết, compile và deploy smart contract Solidity.

### Bước R1: Mở Remix IDE

1. Truy cập: **https://remix.ethereum.org/**
2. Tại panel bên trái → tab **File Explorer** → tạo file mới: `Certificate.sol`

### Bước R2: Copy Smart Contract

Copy toàn bộ nội dung file `contracts/Certificate.sol` vào Remix:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Certificate {
    struct CertificateData {
        string  recipientName;
        string  certId;
        bytes32 fileHash;
        string  ipfsHash;
        uint256 issuedAt;
        address issuedBy;
        bool    isRevoked;
        bool    exists;
    }

    address public owner;
    mapping(string => CertificateData) private certificates;
    mapping(bytes32 => string) private hashToCertId;
    string[] public allCertIds;

    event CertificateIssued(string indexed certId, string recipientName, bytes32 fileHash, address issuedBy, uint256 issuedAt);
    event CertificateRevoked(string indexed certId, address revokedBy, uint256 revokedAt);

    modifier onlyOwner() {
        require(msg.sender == owner, "Chi admin moi co quyen thuc hien");
        _;
    }

    constructor() { owner = msg.sender; }

    function issueCertificate(string memory _certId, string memory _recipientName, bytes32 _fileHash, string memory _ipfsHash) external onlyOwner {
        require(!certificates[_certId].exists, "Chung chi nay da duoc cap truoc do");
        require(bytes(hashToCertId[_fileHash]).length == 0, "File nay da duoc cap chung chi roi");
        certificates[_certId] = CertificateData(_recipientName, _certId, _fileHash, _ipfsHash, block.timestamp, msg.sender, false, true);
        hashToCertId[_fileHash] = _certId;
        allCertIds.push(_certId);
        emit CertificateIssued(_certId, _recipientName, _fileHash, msg.sender, block.timestamp);
    }

    function revokeCertificate(string memory _certId) external onlyOwner {
        require(certificates[_certId].exists, "Khong tim thay chung chi");
        require(!certificates[_certId].isRevoked, "Chung chi nay da bi thu hoi roi");
        certificates[_certId].isRevoked = true;
        emit CertificateRevoked(_certId, msg.sender, block.timestamp);
    }

    function getCertificate(string memory _certId) external view returns (CertificateData memory) {
        require(certificates[_certId].exists, "Khong tim thay chung chi");
        return certificates[_certId];
    }

    function verifyCertificate(string memory _certId) external view returns (bool isValid, bool isRevoked, CertificateData memory data) {
        if (!certificates[_certId].exists) return (false, false, data);
        data = certificates[_certId];
        isRevoked = data.isRevoked;
        isValid = !data.isRevoked;
    }

    function verifyByHash(bytes32 _fileHash) external view returns (string memory certId, bool isValid, CertificateData memory data) {
        certId = hashToCertId[_fileHash];
        if (bytes(certId).length == 0) return ("", false, data);
        data = certificates[certId];
        isValid = !data.isRevoked;
    }

    function getTotalCertificates() external view returns (uint256) { return allCertIds.length; }
    function getAllCertIds() external view returns (string[] memory) { return allCertIds; }
}
```

### Bước R3: Compile

1. Chuyển sang tab **Solidity Compiler** (icon chữ S)
2. Chọn Compiler version: **0.8.20**
3. Nhấn **Compile Certificate.sol**
4. ✅ Compilation successful (không có error)

### Bước R4: Deploy qua MetaMask (Injected Provider)

1. Chuyển sang tab **Deploy & Run Transactions** (icon ▶️)
2. **ENVIRONMENT:** chọn **"Injected Provider - MetaMask"**
3. MetaMask popup → chọn mạng **Hardhat Local** → Connect
4. **CONTRACT:** chọn `Certificate`
5. Nhấn **Deploy** → MetaMask → **Confirm**
6. ✅ Contract xuất hiện trong "Deployed Contracts"

### Bước R5: Tương Tác Trên Remix

#### Cấp chứng chỉ:
```
issueCertificate(
  "REMIX-001",
  "Nguyen Van Test",
  0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,
  "QmTestIPFSHash123"
)
```
→ Nhấn **transact** → MetaMask Confirm

#### Xác thực:
```
verifyCertificate("REMIX-001")
```
→ Kết quả: `isValid: true, isRevoked: false, data: {...}`

#### Thu hồi:
```
revokeCertificate("REMIX-001")
```
→ MetaMask Confirm → `isRevoked: true`

---

## 🧪 Chạy Tests

```bash
npx hardhat test
```

**Kết quả:** 16 passing ✅

| Nhóm test | Tests |
|-----------|-------|
| Deployment | 2 |
| issueCertificate | 5 |
| revokeCertificate | 4 |
| Verification | 5 |

---

## 📊 Bảng Tóm Tắt Tài Khoản Test

| Tài khoản | Loại | Địa chỉ | Private Key |
|-----------|------|---------|-------------|
| Account #0 (Admin) | MetaMask | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Account #1 | MetaMask | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| User test | Google | Dùng bất kỳ Gmail nào | – |

## 📊 Mã Chứng Chỉ Mẫu

| Mã CC | Người nhận | Dùng cho |
|-------|-----------|----------|
| `CERT-2024-001` | Nguyễn Văn A | Demo cấp + xác thực |
| `CERT-2024-002` | Trần Thị B | Demo thêm |
| `CERT-2024-003` | Lê Văn C | Demo thu hồi |

---

## 🔑 Cấu Hình Pinata IPFS (Tùy chọn)

1. Đăng ký tại [pinata.cloud](https://pinata.cloud)
2. Tạo API Key tại [app.pinata.cloud/keys](https://app.pinata.cloud/keys)
3. Điền vào `frontend/js/config.js`:
```js
const PINATA_CONFIG = {
  apiKey:    "your_api_key",
  secretKey: "your_secret_key",
  ...
};
```
> ⚠️ Nếu không cấu hình, hệ thống dùng **mock IPFS hash** để demo.

---

## 🔧 Deploy lên Sepolia Testnet

1. Tạo file `.env` từ `.env.example`
2. Điền `PRIVATE_KEY` và `SEPOLIA_RPC_URL`
3. Lấy ETH test từ [sepoliafaucet.com](https://sepoliafaucet.com)
4. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

---

## ❓ Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| MetaMask: "Nonce too high" | MetaMask → Settings → Advanced → Clear activity tab data |
| MetaMask: "Internal JSON-RPC error" | Kiểm tra `npx hardhat node` đang chạy, re-deploy contract |
| Google Login: popup blocked | Cho phép popup trong trình duyệt |
| Firestore: permission denied | Kiểm tra Security Rules (test mode) |
| Contract: "Chung chi nay da duoc cap" | Đổi mã chứng chỉ khác hoặc restart hardhat node |
| Frontend trắng | Mở DevTools (F12) → Console để xem lỗi |

---

## 👥 Nhóm 6

Đồ án môn học **Blockchain** – Prototype xác thực chứng chỉ phi tập trung.
