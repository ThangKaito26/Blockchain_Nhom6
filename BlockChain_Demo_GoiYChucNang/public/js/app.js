// Smart Contract details (Replace with your actual deployed contract address and ABI)
const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";
const CONTRACT_ABI = [
	{
		"inputs": [
			{ "internalType": "string", "name": "_certHash", "type": "string" },
			{ "internalType": "string", "name": "_issuerName", "type": "string" }
		],
		"name": "issueCertificate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "string", "name": "_certHash", "type": "string" }
		],
		"name": "revokeCertificate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "string", "name": "_certHash", "type": "string" }
		],
		"name": "verifyCertificate",
		"outputs": [
			{ "internalType": "bool", "name": "exists", "type": "bool" },
			{ "internalType": "bool", "name": "isValid", "type": "bool" },
			{ "internalType": "string", "name": "issuerName", "type": "string" },
			{ "internalType": "uint256", "name": "issueDate", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let provider;
let signer;
let contract;

// Initialize Ethers.js
async function initWeb3() {
    if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        try {
            const network = await provider.getNetwork();
            console.log("Connected to network:", network.name);
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        } catch (error) {
            console.error("Error initializing Web3:", error);
        }
    }
}
initWeb3();

// --- HOME PAGE LOGIC ---
const verifyCodeForm = document.getElementById('verifyCodeForm');
const verifyFileForm = document.getElementById('verifyFileForm');
const resultBox = document.getElementById('resultBox');

if (verifyCodeForm) {
    verifyCodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('certCodeInput').value;
        const res = await fetch('/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ certCode: code })
        });
        const data = await res.json();
        handleVerifyResult(data);
    });
}

if (verifyFileForm) {
    verifyFileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('certFileInput');
        const formData = new FormData();
        formData.append('certFile', fileInput.files[0]);

        const res = await fetch('/verify-file', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        handleVerifyResult(data, data.hash);
    });
}

async function handleVerifyResult(data, fileHash = null) {
    resultBox.classList.remove('hidden', 'valid', 'invalid');
    const resultStatus = document.getElementById('resultStatus');
    const resultDetails = document.getElementById('resultDetails');
    const bcStatus = document.getElementById('blockchainStatus');
    
    if (data.success && data.cert) {
        // Exists in DB, verify with Smart Contract
        let hashToVerify = fileHash || data.cert.FileHash;
        bcStatus.innerHTML = '<span class="loader"></span> Đang xác thực với Blockchain...';
        
        try {
            if (contract && CONTRACT_ADDRESS !== "0xYourDeployedContractAddressHere") {
                const bcData = await contract.verifyCertificate(hashToVerify);
                if (bcData.exists && bcData.isValid) {
                    showValid(data.cert);
                } else if (bcData.exists && !bcData.isValid) {
                    showInvalid("Chứng chỉ đã bị Thu Hồi (Revoked) trên Blockchain!");
                } else {
                    showInvalid("Không tìm thấy hash này trên Blockchain (Dữ liệu không khớp)!");
                }
            } else {
                // Mock behavior if contract not deployed
                bcStatus.innerHTML = '<span style="color:orange">⚠️ Bỏ qua Web3 do chưa cấu hình Smart Contract. Sử dụng CSDL.</span>';
                if (data.cert.Status === 'Valid') showValid(data.cert);
                else showInvalid("Chứng chỉ đã bị thu hồi.");
            }
        } catch (err) {
            console.error(err);
            bcStatus.innerHTML = '<span style="color:red">Lỗi khi kết nối Blockchain!</span>';
            showValid(data.cert); // fallback db
        }
    } else {
        showInvalid("Không tìm thấy chứng chỉ hoặc file đã bị chỉnh sửa!");
        bcStatus.innerHTML = "";
    }
}

function showValid(cert) {
    resultBox.classList.add('valid');
    document.getElementById('resultIcon').innerHTML = '✅';
    document.getElementById('resultStatus').innerText = 'Chứng Chỉ Hợp Lệ';
    document.getElementById('resultStatus').style.color = 'var(--success)';
    document.getElementById('resultDetails').innerHTML = `
        <p><strong>Mã:</strong> ${cert.CertCode}</p>
        <p><strong>Người Nhận:</strong> ${cert.RecipientName}</p>
        <p><strong>Khóa Học:</strong> ${cert.CourseName}</p>
        <p><strong>Đơn Vị Cấp:</strong> ${cert.IssuerName}</p>
        <p><strong>Ngày Cấp:</strong> ${new Date(cert.IssueDate).toLocaleDateString('vi-VN')}</p>
    `;
    if(CONTRACT_ADDRESS !== "0xYourDeployedContractAddressHere") {
        document.getElementById('blockchainStatus').innerHTML = 'Đã xác minh toàn vẹn dữ liệu trên Blockchain.';
    }
}

function showInvalid(msg) {
    resultBox.classList.add('invalid');
    document.getElementById('resultIcon').innerHTML = '❌';
    document.getElementById('resultStatus').innerText = 'Chứng Chỉ Không Hợp Lệ';
    document.getElementById('resultStatus').style.color = 'var(--danger)';
    document.getElementById('resultDetails').innerHTML = `<p>${msg}</p>`;
}

// --- ADMIN LOGIC ---
const btnConnectWallet = document.getElementById('btnConnectWallet');
if (btnConnectWallet) {
    btnConnectWallet.addEventListener('click', async () => {
        if (!window.ethereum) return alert("Vui lòng cài đặt ví MetaMask!");
        try {
            const accounts = await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            document.getElementById('walletAddressDisplay').innerText = accounts[0];
            document.getElementById('walletAddressDisplay').style.color = 'var(--success)';
        } catch (err) {
            console.error(err);
        }
    });
}

// Issue Flow
const issueForm = document.getElementById('issueForm');
let pendingCertData = null;

if (issueForm) {
    issueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnPrepare = document.getElementById('btnPrepareIssue');
        const btnSign = document.getElementById('btnSignMetaMask');
        const status = document.getElementById('issueStatus');
        
        btnPrepare.disabled = true;
        btnPrepare.innerText = 'Đang xử lý Upload IPFS...';
        status.innerHTML = '';

        const formData = new FormData();
        formData.append('recipientName', document.getElementById('recipientName').value);
        formData.append('courseName', document.getElementById('courseName').value);
        formData.append('certCode', document.getElementById('certCode').value);
        formData.append('issuerName', document.getElementById('issuerName').value);
        formData.append('certFile', document.getElementById('certPdf').files[0]);

        try {
            const res = await fetch('/admin/prepare-issue', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.success) {
                pendingCertData = {
                    certCode: formData.get('certCode'),
                    recipientName: formData.get('recipientName'),
                    courseName: formData.get('courseName'),
                    issuerName: formData.get('issuerName'),
                    ipfsCID: data.ipfsCID,
                    fileHash: data.hash
                };
                
                status.innerHTML = `<span style="color:var(--success)">Upload thành công! Hash: ${data.hash.substring(0,20)}...</span>`;
                btnPrepare.style.display = 'none';
                btnSign.disabled = false;
            } else {
                status.innerHTML = `<span style="color:var(--danger)">Lỗi: ${data.message}</span>`;
                btnPrepare.disabled = false;
                btnPrepare.innerText = 'B1: Chuẩn bị & Upload IPFS';
            }
        } catch (err) {
            console.error(err);
            btnPrepare.disabled = false;
            btnPrepare.innerText = 'B1: Chuẩn bị & Upload IPFS';
        }
    });

    document.getElementById('btnSignMetaMask').addEventListener('click', async () => {
        if (!signer) return alert("Vui lòng kết nối MetaMask trước!");
        const status = document.getElementById('issueStatus');
        const btnSign = document.getElementById('btnSignMetaMask');
        
        try {
            btnSign.disabled = true;
            btnSign.innerText = 'Đang chờ ký...';
            
            // Call Smart Contract
            if(CONTRACT_ADDRESS !== "0xYourDeployedContractAddressHere") {
                const tx = await contract.issueCertificate(pendingCertData.fileHash, pendingCertData.issuerName);
                status.innerHTML = `<span style="color:orange">Đang đợi giao dịch Blockchain (Tx: ${tx.hash.substring(0,10)}...)</span>`;
                await tx.wait(); // Wait for confirmation
            }
            
            // Save to DB
            status.innerHTML = `<span style="color:orange">Giao dịch thành công! Đang lưu CSDL...</span>`;
            const res = await fetch('/admin/save-certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingCertData)
            });
            const data = await res.json();
            
            if (data.success) {
                alert("Cấp chứng chỉ thành công!");
                window.location.reload();
            } else {
                status.innerHTML = `<span style="color:var(--danger)">Lỗi lưu CSDL!</span>`;
            }
        } catch (err) {
            console.error(err);
            status.innerHTML = `<span style="color:var(--danger)">Lỗi MetaMask: Giao dịch bị từ chối hoặc thất bại.</span>`;
            btnSign.disabled = false;
            btnSign.innerText = 'B2: Ký Giao Dịch (MetaMask)';
        }
    });
}

// Revoke Logic
document.querySelectorAll('.btn-revoke').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        if (!signer) return alert("Vui lòng kết nối MetaMask trước!");
        if (!confirm("Bạn có chắc muốn THU HỒI chứng chỉ này?")) return;
        
        const hash = e.target.getAttribute('data-hash');
        try {
            e.target.disabled = true;
            e.target.innerText = 'Đang ký...';
            
            if(CONTRACT_ADDRESS !== "0xYourDeployedContractAddressHere") {
                const tx = await contract.revokeCertificate(hash);
                await tx.wait();
            }
            
            const res = await fetch('/admin/revoke-certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileHash: hash })
            });
            
            if ((await res.json()).success) {
                alert("Thu hồi thành công!");
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi thu hồi!");
            e.target.disabled = false;
            e.target.innerText = 'Thu Hồi';
        }
    });
});

// QR Code Logic
const qrModal = document.getElementById('qrModal');
if (qrModal) {
    document.querySelectorAll('.btn-qr').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = e.target.getAttribute('data-code');
            const url = window.location.origin + "/?cert=" + code;
            
            document.getElementById('qrcode').innerHTML = '';
            new QRCode(document.getElementById('qrcode'), {
                text: url,
                width: 200,
                height: 200
            });
            document.getElementById('qrLink').innerText = url;
            qrModal.style.display = 'block';
        });
    });

    document.querySelector('.close').addEventListener('click', () => qrModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == qrModal) qrModal.style.display = 'none';
    });
}

// Check URL for cert parameter to auto search
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const certCode = urlParams.get('cert');
    if (certCode && document.getElementById('certCodeInput')) {
        document.getElementById('certCodeInput').value = certCode;
        document.getElementById('verifyCodeForm').dispatchEvent(new Event('submit'));
    }
});
