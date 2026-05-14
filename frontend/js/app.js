// ============================================================
// frontend/js/app.js – Logic chính của ứng dụng
// ============================================================
// Tương tác với MetaMask và Smart Contract qua ethers.js v6
// ============================================================

// ── Biến toàn cục ────────────────────────────────────────────
let provider = null;   // ethers.js provider (kết nối với MetaMask)
let signer   = null;   // Người ký giao dịch (tài khoản MetaMask)
let contract = null;   // Instance của smart contract
let currentAccount = null; // Địa chỉ ví hiện tại
let isAdmin = false;       // Có phải admin không

// ── Khởi tạo khi trang load xong ─────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Kiểm tra MetaMask có được cài không
  if (typeof window.ethereum !== "undefined") {
    // Lắng nghe sự kiện đổi tài khoản MetaMask
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    // Lắng nghe sự kiện đổi mạng
    window.ethereum.on("chainChanged", () => window.location.reload());

    // Thử tự kết nối nếu đã từng cho phép trước đó
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) await initializeApp(accounts[0]);
  }

  // Gán sự kiện cho nút kết nối ví (nếu có trên trang)
  const btnConnect = document.getElementById("btn-connect");
  if (btnConnect) btnConnect.addEventListener("click", connectWallet);
});

// ============================================================
// KẾT NỐI VÍ METAMASK
// ============================================================
/**
 * Yêu cầu người dùng kết nối MetaMask
 * Sau khi kết nối, khởi tạo ethers.js và kiểm tra quyền admin
 */
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    showToast("Vui lòng cài đặt MetaMask để tiếp tục!", "error");
    window.open("https://metamask.io/download/", "_blank");
    return;
  }

  try {
    showToast("Đang kết nối MetaMask...", "info");

    // Yêu cầu người dùng cho phép kết nối
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    await initializeApp(accounts[0]);
    showToast("Kết nối ví thành công!", "success");
  } catch (error) {
    if (error.code === 4001) {
      showToast("Bạn đã từ chối kết nối MetaMask.", "warning");
    } else {
      showToast("Lỗi kết nối: " + error.message, "error");
    }
  }
}

/**
 * Khởi tạo ethers.js provider, signer và contract instance
 * @param {string} account - Địa chỉ ví vừa kết nối
 */
async function initializeApp(account) {
  currentAccount = account;

  // Tạo provider từ MetaMask (window.ethereum)
  provider = new ethers.BrowserProvider(window.ethereum);

  // Lấy signer = người sẽ ký các giao dịch
  signer = await provider.getSigner();

  // Tạo instance contract với signer (có thể ghi dữ liệu)
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  // Kiểm tra xem tài khoản có phải admin không
  await checkAdminRole();

  // Cập nhật giao diện
  updateWalletUI();

  // Nếu trang admin → tải danh sách chứng chỉ
  if (document.getElementById("cert-list")) {
    await loadCertificateList();
  }
}

/**
 * Xử lý khi MetaMask đổi tài khoản
 */
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // Ngắt kết nối
    currentAccount = null;
    signer = null;
    contract = null;
    isAdmin = false;
    updateWalletUI();
  } else {
    await initializeApp(accounts[0]);
  }
}

/**
 * Kiểm tra tài khoản hiện tại có phải owner (admin) không
 * Gọi hàm owner() của smart contract để so sánh
 */
async function checkAdminRole() {
  try {
    const ownerAddress = await contract.owner();
    isAdmin = ownerAddress.toLowerCase() === currentAccount.toLowerCase();
  } catch {
    isAdmin = false;
  }
}

/**
 * Cập nhật giao diện theo trạng thái kết nối ví
 */
function updateWalletUI() {
  const btnConnect     = document.getElementById("btn-connect");
  const walletInfo     = document.getElementById("wallet-info");
  const walletAddress  = document.getElementById("wallet-address");
  const adminBadge     = document.getElementById("admin-badge");
  const adminSection   = document.getElementById("admin-section");
  const notAdminMsg    = document.getElementById("not-admin-msg");

  if (currentAccount) {
    // Hiện thông tin ví
    if (btnConnect)   btnConnect.style.display = "none";
    if (walletInfo)   walletInfo.style.display = "flex";
    if (walletAddress) walletAddress.textContent = shortenAddress(currentAccount);

    // Hiển thị badge ADMIN nếu đúng quyền
    if (adminBadge) adminBadge.style.display = isAdmin ? "inline-flex" : "none";

    // Trang admin: ẩn/hiện khu vực quản trị
    if (adminSection) adminSection.style.display = isAdmin ? "block" : "none";
    if (notAdminMsg)  notAdminMsg.style.display  = isAdmin ? "none" : "block";
  } else {
    // Chưa kết nối
    if (btnConnect)  btnConnect.style.display = "flex";
    if (walletInfo)  walletInfo.style.display = "none";
    if (adminSection) adminSection.style.display = "none";
    if (notAdminMsg)  notAdminMsg.style.display  = "block";
  }
}

// ============================================================
// CẤP CHỨNG CHỈ (ADMIN)
// ============================================================
/**
 * Xử lý form cấp chứng chỉ mới
 * Quy trình: Hash PDF → Upload IPFS → Ghi lên Blockchain
 */
async function handleIssueCertificate(event) {
  event.preventDefault();

  if (!isAdmin) { showToast("Bạn không có quyền admin!", "error"); return; }

  // Lấy dữ liệu từ form
  const certId    = document.getElementById("input-cert-id").value.trim();
  const recipient = document.getElementById("input-recipient").value.trim();
  const fileInput = document.getElementById("input-pdf");
  const file      = fileInput.files[0];

  if (!certId || !recipient || !file) {
    showToast("Vui lòng điền đầy đủ thông tin!", "warning");
    return;
  }
  if (file.type !== "application/pdf") {
    showToast("Chỉ chấp nhận file PDF!", "warning");
    return;
  }

  // Hiển thị loading
  setIssueLoading(true);

  try {
    // BƯỚC 1: Tính SHA-256 hash của file PDF
    showIssueStep(1, "Đang tính mã băm SHA-256 của file...");
    const hashResult = await computeFileHash(file);

    // Hiển thị hash ra giao diện
    const hashDisplay = document.getElementById("hash-display");
    if (hashDisplay) {
      hashDisplay.textContent = hashResult.hex;
      hashDisplay.parentElement.style.display = "block";
    }

    // BƯỚC 2: Upload file PDF lên IPFS
    showIssueStep(2, "Đang upload file lên IPFS (Pinata)...");
    const ipfsCid = await uploadToIPFS(file);

    // BƯỚC 3: Gửi giao dịch lên Blockchain
    showIssueStep(3, "Đang gửi giao dịch lên Blockchain...");
    const tx = await contract.issueCertificate(
      certId,
      recipient,
      hashResult.bytes32,  // bytes32 cho Solidity
      ipfsCid
    );

    // BƯỚC 4: Chờ giao dịch được xác nhận
    showIssueStep(4, "Đang chờ xác nhận từ Blockchain...");
    const receipt = await tx.wait();

    // Thành công!
    showToast(`✅ Cấp chứng chỉ thành công! TX: ${shortenAddress(receipt.hash)}`, "success", 5000);

    // Tạo QR code cho chứng chỉ vừa cấp
    const verifyUrl = `${BLOCKCHAIN_CONFIG.verifyBaseUrl}?certId=${encodeURIComponent(certId)}`;
    generateQRCode("qr-container", verifyUrl);
    document.getElementById("qr-section").style.display = "block";
    document.getElementById("qr-cert-id").textContent = certId;

    // Reset form
    event.target.reset();
    if (hashDisplay) hashDisplay.parentElement.style.display = "none";

    // Tải lại danh sách
    await loadCertificateList();

  } catch (error) {
    console.error(error);
    if (error.code === 4001) {
      showToast("Giao dịch bị hủy bởi người dùng.", "warning");
    } else if (error.message.includes("Chung chi nay da duoc cap")) {
      showToast("Mã chứng chỉ này đã tồn tại!", "error");
    } else if (error.message.includes("File nay da duoc cap")) {
      showToast("File PDF này đã được cấp chứng chỉ rồi!", "error");
    } else {
      showToast("Lỗi: " + error.message, "error");
    }
  } finally {
    setIssueLoading(false);
    clearIssueStep();
  }
}

/** Hiển thị bước đang thực hiện trong quá trình cấp chứng chỉ */
function showIssueStep(step, message) {
  const el = document.getElementById("issue-status");
  if (el) {
    el.innerHTML = `<span class="step-badge">Bước ${step}/4</span> ${message}`;
    el.style.display = "flex";
  }
}
function clearIssueStep() {
  const el = document.getElementById("issue-status");
  if (el) el.style.display = "none";
}
function setIssueLoading(loading) {
  const btn = document.getElementById("btn-issue");
  if (btn) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<span class="spinner"></span> Đang xử lý...'
      : '🎓 Cấp Chứng Chỉ';
  }
}

// ============================================================
// THU HỒI CHỨNG CHỈ (ADMIN)
// ============================================================
/**
 * Thu hồi một chứng chỉ theo certId
 * @param {string} certId - Mã chứng chỉ cần thu hồi
 */
async function revokeCertificate(certId) {
  if (!isAdmin) { showToast("Bạn không có quyền admin!", "error"); return; }

  // Xác nhận trước khi thu hồi
  const confirmed = confirm(`Bạn có chắc muốn THU HỒI chứng chỉ "${certId}"?\nHành động này không thể hoàn tác!`);
  if (!confirmed) return;

  try {
    showToast(`Đang thu hồi chứng chỉ ${certId}...`, "info");
    const tx = await contract.revokeCertificate(certId);
    await tx.wait();
    showToast(`✅ Đã thu hồi chứng chỉ ${certId}`, "success");
    await loadCertificateList();
  } catch (error) {
    if (error.code === 4001) {
      showToast("Giao dịch bị hủy.", "warning");
    } else {
      showToast("Lỗi: " + error.message, "error");
    }
  }
}

// ============================================================
// TẢI DANH SÁCH CHỨNG CHỈ (ADMIN)
// ============================================================
/**
 * Tải và hiển thị toàn bộ danh sách chứng chỉ đã cấp
 */
async function loadCertificateList() {
  const listEl = document.getElementById("cert-list");
  if (!listEl || !contract) return;

  listEl.innerHTML = `<div class="loading-spinner"><div class="spinner"></div> Đang tải...</div>`;

  try {
    const certIds = await contract.getAllCertIds();

    if (certIds.length === 0) {
      listEl.innerHTML = `<div class="empty-state">📋 Chưa có chứng chỉ nào được cấp</div>`;
      return;
    }

    // Tải thông tin từng chứng chỉ song song
    const certs = await Promise.all(
      certIds.map(id => contract.getCertificate(id))
    );

    listEl.innerHTML = certs.map((c, i) => `
      <div class="cert-card ${c.isRevoked ? 'revoked' : 'valid'}" id="card-${certIds[i]}">
        <div class="cert-card-header">
          <span class="cert-id">${c.certId}</span>
          <span class="cert-status ${c.isRevoked ? 'status-revoked' : 'status-valid'}">
            ${c.isRevoked ? '🚫 Đã thu hồi' : '✅ Hợp lệ'}
          </span>
        </div>
        <div class="cert-card-body">
          <div class="cert-field"><span>👤 Người nhận:</span> <strong>${c.recipientName}</strong></div>
          <div class="cert-field"><span>📅 Ngày cấp:</span> ${formatDate(c.issuedAt)}</div>
          <div class="cert-field"><span>🔗 IPFS:</span>
            <a href="${PINATA_CONFIG.gateway}${c.ipfsHash}" target="_blank" class="ipfs-link">
              ${c.ipfsHash.slice(0, 20)}...
            </a>
          </div>
          <div class="cert-field hash-field">
            <span>🔐 Hash:</span>
            <code>${c.fileHash.slice(0, 20)}...</code>
            <button onclick="copyToClipboard('${c.fileHash}')" class="btn-copy" title="Sao chép hash">📋</button>
          </div>
        </div>
        <div class="cert-card-actions">
          <button onclick="showCertQR('${c.certId}')" class="btn btn-sm btn-outline">📱 QR Code</button>
          ${!c.isRevoked ? `<button onclick="revokeCertificate('${c.certId}')" class="btn btn-sm btn-danger">🚫 Thu hồi</button>` : ''}
        </div>
      </div>
    `).join("");

    // Cập nhật counter
    const counter = document.getElementById("cert-count");
    if (counter) counter.textContent = certIds.length;

  } catch (error) {
    listEl.innerHTML = `<div class="error-state">❌ Lỗi tải dữ liệu: ${error.message}</div>`;
  }
}

/**
 * Hiện QR code popup cho một chứng chỉ
 */
function showCertQR(certId) {
  const modal = document.getElementById("qr-modal");
  const verifyUrl = `${BLOCKCHAIN_CONFIG.verifyBaseUrl}?certId=${encodeURIComponent(certId)}`;
  if (modal) {
    document.getElementById("modal-cert-id").textContent = certId;
    generateQRCode("modal-qr-container", verifyUrl);
    document.getElementById("modal-qr-url").textContent = verifyUrl;
    modal.style.display = "flex";
  }
}

// ============================================================
// XÁC THỰC CHỨNG CHỈ (USER – verify.html)
// ============================================================
/**
 * Xác thực bằng mã chứng chỉ (certId)
 */
async function verifyByCertId() {
  const certId = document.getElementById("input-verify-id")?.value.trim();
  if (!certId) { showToast("Vui lòng nhập mã chứng chỉ!", "warning"); return; }
  await performVerification("certId", certId, null);
}

/**
 * Xác thực bằng file PDF (tính hash và tra cứu)
 */
async function verifyByFile() {
  const fileInput = document.getElementById("input-verify-file");
  const file = fileInput?.files[0];
  if (!file) { showToast("Vui lòng chọn file PDF!", "warning"); return; }
  if (file.type !== "application/pdf") { showToast("Chỉ chấp nhận file PDF!", "warning"); return; }

  setVerifyLoading(true);
  showToast("Đang tính mã băm file...", "info");

  const hashResult = await computeFileHash(file);
  await performVerification("hash", null, hashResult.bytes32);
}

/**
 * Thực hiện xác thực và render kết quả
 * @param {"certId"|"hash"} mode - Phương thức xác thực
 * @param {string|null} certId    - Mã chứng chỉ (nếu mode=certId)
 * @param {string|null} fileHash  - Mã hash bytes32 (nếu mode=hash)
 */
async function performVerification(mode, certId, fileHash) {
  // Khởi tạo read-only contract (không cần ký)
  if (!provider) {
    try {
      provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.localRPC);
    } catch {
      showToast("Không thể kết nối Blockchain. Vui lòng cài MetaMask.", "error");
      setVerifyLoading(false);
      return;
    }
  }
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  setVerifyLoading(true);
  const resultEl = document.getElementById("verify-result");
  if (resultEl) resultEl.style.display = "none";

  try {
    let isValid, isRevoked, data, foundCertId;

    if (mode === "certId") {
      // Xác thực theo mã chứng chỉ
      [isValid, isRevoked, data] = await readContract.verifyCertificate(certId);
      foundCertId = certId;
    } else {
      // Xác thực theo hash file
      [foundCertId, isValid, data] = await readContract.verifyByHash(fileHash);
      isRevoked = data.isRevoked;
    }

    renderVerifyResult(isValid, isRevoked, data, foundCertId, fileHash);

  } catch (error) {
    renderVerifyResult(false, false, null, certId || "", fileHash);
    console.error(error);
  } finally {
    setVerifyLoading(false);
  }
}

/**
 * Render kết quả xác thực ra giao diện
 */
function renderVerifyResult(isValid, isRevoked, data, certId, fileHash) {
  const resultEl = document.getElementById("verify-result");
  if (!resultEl) return;

  const exists = data && data.exists;

  let statusClass, statusIcon, statusTitle, statusDesc;

  if (!exists || (!certId && !fileHash)) {
    // Không tìm thấy
    statusClass = "result-invalid";
    statusIcon  = "❌";
    statusTitle = "KHÔNG TÌM THẤY CHỨNG CHỈ";
    statusDesc  = "Mã chứng chỉ hoặc file này không tồn tại trong hệ thống.";
  } else if (isRevoked) {
    // Đã thu hồi
    statusClass = "result-revoked";
    statusIcon  = "🚫";
    statusTitle = "CHỨNG CHỈ ĐÃ BỊ THU HỒI";
    statusDesc  = "Chứng chỉ này đã bị thu hồi và không còn giá trị.";
  } else if (isValid) {
    // Hợp lệ
    statusClass = "result-valid";
    statusIcon  = "✅";
    statusTitle = "CHỨNG CHỈ HỢP LỆ";
    statusDesc  = "Chứng chỉ được xác nhận là chính thống và chưa bị thu hồi.";
  } else {
    statusClass = "result-invalid";
    statusIcon  = "⚠️";
    statusTitle = "CHỨNG CHỈ KHÔNG HỢP LỆ";
    statusDesc  = "File có thể đã bị giả mạo hoặc sửa đổi.";
  }

  resultEl.className = `verify-result ${statusClass}`;
  resultEl.innerHTML = `
    <div class="result-header">
      <div class="result-icon">${statusIcon}</div>
      <div>
        <h3 class="result-title">${statusTitle}</h3>
        <p class="result-desc">${statusDesc}</p>
      </div>
    </div>
    ${exists ? `
    <div class="result-details">
      <div class="detail-row"><span>📋 Mã chứng chỉ</span><strong>${data.certId}</strong></div>
      <div class="detail-row"><span>👤 Người nhận</span><strong>${data.recipientName}</strong></div>
      <div class="detail-row"><span>📅 Ngày cấp</span><strong>${formatDate(data.issuedAt)}</strong></div>
      <div class="detail-row"><span>🏛️ Cơ quan cấp</span><strong>${shortenAddress(data.issuedBy)}</strong></div>
      <div class="detail-row"><span>📄 IPFS</span>
        <a href="${PINATA_CONFIG.gateway}${data.ipfsHash}" target="_blank" class="ipfs-link">
          Xem file gốc ↗
        </a>
      </div>
      <div class="detail-row"><span>🔐 Mã băm</span>
        <code class="hash-code">${data.fileHash.slice(0, 30)}...</code>
        <button onclick="copyToClipboard('${data.fileHash}')" class="btn-copy">📋</button>
      </div>
    </div>
    ` : ''}
  `;

  resultEl.style.display = "block";
  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setVerifyLoading(loading) {
  ["btn-verify-id", "btn-verify-file"].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) btn.innerHTML = '<span class="spinner"></span> Đang xác thực...';
    else btn.innerHTML = btn.id === "btn-verify-id" ? "🔍 Xác Thực" : "🔍 Xác Thực File";
  });
}

// ============================================================
// QUÉT QR CODE (USER)
// ============================================================
let qrScanner = null;

/**
 * Bật/tắt camera quét QR
 */
function toggleQRScanner() {
  const container = document.getElementById("qr-scanner-container");
  if (!container) return;

  if (qrScanner) {
    // Đang quét → dừng lại
    qrScanner.clear();
    qrScanner = null;
    container.style.display = "none";
    document.getElementById("btn-scan-qr").textContent = "📷 Quét QR Code";
    return;
  }

  container.style.display = "block";
  document.getElementById("btn-scan-qr").textContent = "⏹ Dừng quét";

  // Khởi tạo scanner từ thư viện html5-qrcode
  qrScanner = new Html5QrcodeScanner("qr-reader", {
    fps: 10,
    qrbox: { width: 250, height: 250 }
  });

  qrScanner.render(
    // Callback khi quét thành công
    (decodedText) => {
      // Trích mã certId từ URL nếu có
      let certId = decodedText;
      try {
        const url = new URL(decodedText);
        const paramCertId = url.searchParams.get("certId");
        if (paramCertId) certId = paramCertId;
      } catch { /* không phải URL */ }

      // Điền vào ô nhập và tự động xác thực
      const input = document.getElementById("input-verify-id");
      if (input) {
        input.value = certId;
        // Chuyển sang tab nhập mã
        switchVerifyTab("tab-id");
      }

      // Dừng scanner
      toggleQRScanner();
      showToast(`📷 Quét được: ${certId}`, "success");
    },
    // Callback lỗi (bỏ qua để không spam console)
    () => {}
  );
}

// ============================================================
// CHUYỂN TAB (VERIFY PAGE)
// ============================================================
function switchVerifyTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));

  const btn  = document.getElementById(tabId + "-btn");
  const pane = document.getElementById(tabId + "-pane");
  if (btn)  btn.classList.add("active");
  if (pane) pane.classList.add("active");
}

// ============================================================
// ĐÓNG MODAL
// ============================================================
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
}

// Đóng modal khi click bên ngoài
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.style.display = "none";
  }
});

// ============================================================
// AUTO-VERIFY từ URL params (verify.html?certId=...)
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const certIdParam = params.get("certId");
  if (certIdParam) {
    const input = document.getElementById("input-verify-id");
    if (input) {
      input.value = certIdParam;
      // Tự động xác thực sau 500ms (chờ trang render xong)
      setTimeout(verifyByCertId, 500);
    }
  }
});
