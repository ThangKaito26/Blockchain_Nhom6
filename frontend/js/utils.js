// ============================================================
// frontend/js/utils.js – Các hàm tiện ích
// ============================================================
// Bao gồm:
//  - computeFileHash: Tính SHA-256 của file PDF
//  - uploadToIPFS: Upload file lên IPFS qua Pinata API
//  - generateQRCode: Tạo mã QR Code
//  - formatDate: Format timestamp sang ngày tháng tiếng Việt
//  - shortenAddress: Rút gọn địa chỉ ví Ethereum
// ============================================================

/**
 * Tính mã băm SHA-256 của một file
 * ─────────────────────────────────
 * Quy trình:
 *   1. Đọc file thành ArrayBuffer
 *   2. Chuyển sang WordArray (định dạng CryptoJS)
 *   3. Tính SHA-256 → trả về chuỗi hex 64 ký tự
 *   4. Chuyển hex → bytes32 (thêm 0x prefix) cho Solidity
 *
 * @param {File} file - File PDF cần tính hash
 * @returns {Promise<{hex: string, bytes32: string}>}
 *   - hex: Chuỗi hex SHA-256 (ví dụ: "a3f1...")
 *   - bytes32: Dạng bytes32 cho Solidity (ví dụ: "0xa3f1...")
 */
async function computeFileHash(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Đọc file dưới dạng ArrayBuffer (binary data)
    reader.readAsArrayBuffer(file);

    reader.onload = function (event) {
      try {
        // Lấy dữ liệu binary từ ArrayBuffer
        const arrayBuffer = event.target.result;

        // Chuyển ArrayBuffer → Uint8Array → CryptoJS WordArray
        // CryptoJS cần WordArray để tính hash
        const wordArray = CryptoJS.lib.WordArray.create(
          new Uint8Array(arrayBuffer)
        );

        // Tính SHA-256 hash
        const hashHex = CryptoJS.SHA256(wordArray).toString();

        // Thêm "0x" để tương thích với kiểu bytes32 của Solidity
        const hashBytes32 = "0x" + hashHex;

        resolve({ hex: hashHex, bytes32: hashBytes32 });
      } catch (error) {
        reject(new Error("Không thể tính hash file: " + error.message));
      }
    };

    reader.onerror = () => reject(new Error("Không thể đọc file"));
  });
}

/**
 * Upload file PDF lên IPFS thông qua Pinata API
 * ──────────────────────────────────────────────
 * Pinata là dịch vụ pinning IPFS: file được upload lên IPFS
 * và Pinata đảm bảo file không bị xóa (pinned).
 *
 * API endpoint: POST https://api.pinata.cloud/pinning/pinFileToIPFS
 * Trả về: CID (Content Identifier) của file trên IPFS
 *
 * @param {File} file - File PDF cần upload
 * @returns {Promise<string>} CID của file trên IPFS
 */
async function uploadToIPFS(file) {
  // Kiểm tra cấu hình API key
  if (PINATA_CONFIG.apiKey === "YOUR_PINATA_API_KEY") {
    // Chế độ demo: trả về hash giả để test mà không cần key thật
    console.warn("⚠️ Chưa cấu hình Pinata API Key. Dùng mock IPFS hash.");
    return "QmMockIPFSHash" + Date.now();
  }

  // Tạo FormData để gửi file
  const formData = new FormData();
  formData.append("file", file);

  // Metadata cho file trên IPFS
  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      app: "BlockchainCertVerify"
    }
  });
  formData.append("pinataMetadata", metadata);

  // Tùy chọn
  const options = JSON.stringify({ cidVersion: 1 });
  formData.append("pinataOptions", options);

  // Gửi request đến Pinata API
  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      // Authentication bằng API Key
      "pinata_api_key":        PINATA_CONFIG.apiKey,
      "pinata_secret_api_key": PINATA_CONFIG.secretKey
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IPFS upload thất bại: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // IpfsHash là CID của file vừa upload
  return result.IpfsHash;
}

/**
 * Tạo mã QR Code trong một element DOM
 * ──────────────────────────────────────
 * Sử dụng thư viện QRCode.js (import qua CDN).
 * QR code chứa URL dẫn đến trang xác thực của chứng chỉ đó.
 *
 * @param {string} elementId - ID của element chứa QR code
 * @param {string} url       - URL sẽ được mã hóa vào QR
 */
function generateQRCode(elementId, url) {
  // Xóa QR cũ nếu có
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = "";

  // Tạo QR code mới bằng thư viện QRCode.js
  new QRCode(container, {
    text:          url,          // Nội dung QR = URL xác thực
    width:         200,          // Chiều rộng (pixel)
    height:        200,          // Chiều cao (pixel)
    colorDark:     "#1a1a2e",    // Màu điểm QR (xanh đậm)
    colorLight:    "#ffffff",    // Màu nền
    correctLevel:  QRCode.CorrectLevel.H  // Mức sửa lỗi cao nhất
  });
}

/**
 * Format Unix Timestamp sang chuỗi ngày tháng tiếng Việt
 * ────────────────────────────────────────────────────────
 * @param {number|bigint} timestamp - Unix timestamp (giây)
 * @returns {string} Ví dụ: "13/05/2024, 14:30:00"
 */
function formatDate(timestamp) {
  // Blockchain lưu timestamp theo giây, JS cần millisecond
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("vi-VN", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/**
 * Rút gọn địa chỉ ví Ethereum để hiển thị
 * ─────────────────────────────────────────
 * Ví dụ: "0x1234...5678" (giữ 6 ký tự đầu và 4 ký tự cuối)
 *
 * @param {string} address - Địa chỉ ví đầy đủ (42 ký tự)
 * @returns {string} Địa chỉ rút gọn
 */
function shortenAddress(address) {
  if (!address || address.length < 10) return address;
  return address.slice(0, 6) + "..." + address.slice(-4);
}

/**
 * Hiển thị thông báo Toast (popup nhỏ)
 * ──────────────────────────────────────
 * @param {string} message - Nội dung thông báo
 * @param {"success"|"error"|"info"|"warning"} type - Loại thông báo
 * @param {number} duration - Thời gian hiển thị (ms), mặc định 3000
 */
function showToast(message, type = "info", duration = 3500) {
  // Tạo element toast
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Icon tương ứng từng loại
  const icons = {
    success: "✅",
    error:   "❌",
    info:    "ℹ️",
    warning: "⚠️"
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || "ℹ️"}</span>
    <span class="toast-message">${message}</span>
  `;

  // Thêm vào trang
  document.body.appendChild(toast);

  // Kích hoạt animation hiện
  requestAnimationFrame(() => toast.classList.add("toast-visible"));

  // Ẩn và xóa sau khoảng thời gian
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 400); // Chờ animation kết thúc
  }, duration);
}

/**
 * Copy văn bản vào clipboard
 * @param {string} text - Văn bản cần copy
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Đã sao chép vào clipboard!", "success", 2000);
  } catch {
    // Fallback cho trình duyệt cũ
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    showToast("Đã sao chép!", "success", 2000);
  }
}

/**
 * Debounce: Trì hoãn thực thi hàm, tránh gọi quá nhiều lần
 * @param {Function} fn - Hàm cần debounce
 * @param {number} delay - Thời gian trì hoãn (ms)
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
