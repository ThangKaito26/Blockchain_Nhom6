# 🔐 BlockCert – Xác Thực Chứng Chỉ Blockchain

Đồ án môn Blockchain – Nhóm 6  
Hệ thống cấp và xác thực chứng chỉ học tập trên nền tảng **Ethereum Blockchain + IPFS**.

---

## 🗂️ Cấu Trúc Thư Mục

```
blockchain-certificate-verify/
├── contracts/
│   └── Certificate.sol      # Smart contract Solidity (có chú thích tiếng Việt)
├── scripts/
│   └── deploy.js            # Deploy + tự động cập nhật config.js
├── test/
│   └── Certificate.test.js  # 16 unit tests (16 passing ✅)
├── frontend/
│   ├── css/style.css        # Dark theme + glassmorphism
│   ├── js/
│   │   ├── config.js        # ABI + địa chỉ contract + Pinata config
│   │   ├── utils.js         # SHA-256, IPFS upload, QR, Toast
│   │   └── app.js           # MetaMask, ethers.js, DOM logic
│   ├── index.html           # Landing page
│   ├── verify.html          # Trang xác thực (User)
│   └── admin.html           # Trang quản trị (Admin)
├── hardhat.config.js
├── .env.example
└── package.json
```

---

## ⚡ Hướng Dẫn Chạy Nhanh

### Bước 1: Cài dependencies
```bash
npm install
```

### Bước 2: Chạy Blockchain local
```bash
npx hardhat node
```
> Giữ terminal này mở. Copy một trong các **private key** được in ra.

### Bước 3: Deploy smart contract
Mở terminal mới:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
> Script sẽ **tự động cập nhật** `frontend/js/config.js` với địa chỉ contract mới.

### Bước 4: Cấu hình MetaMask
1. Thêm mạng **Custom RPC**:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
2. Import tài khoản: **Import Account → Private Key** → paste key từ Bước 2

### Bước 5: Mở Frontend
Mở trực tiếp file HTML trong trình duyệt:
- `frontend/index.html` – Trang chủ
- `frontend/admin.html` – Đăng nhập MetaMask → cấp/thu hồi chứng chỉ
- `frontend/verify.html` – Xác thực chứng chỉ

---

## 🔑 Cấu Hình Pinata IPFS (Tùy chọn)

1. Đăng ký tài khoản miễn phí tại [pinata.cloud](https://pinata.cloud)
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

## 🔧 Deploy lên Sepolia Testnet

1. Tạo file `.env` từ `.env.example`
2. Điền `PRIVATE_KEY` và `SEPOLIA_RPC_URL`
3. Lấy ETH test từ [sepoliafaucet.com](https://sepoliafaucet.com)
4. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
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
| Mã băm | SHA-256 |

---

## 👥 Nhóm 6

Đồ án môn học **Blockchain** – Prototype xác thực chứng chỉ phi tập trung.
