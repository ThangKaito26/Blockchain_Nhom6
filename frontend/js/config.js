// ============================================================
// frontend/js/config.js – Cấu hình toàn cục
// ============================================================
// File này chứa địa chỉ contract, ABI và API keys.
// SAU KHI DEPLOY, chạy script/deploy.js sẽ tự cập nhật file này.
// ============================================================

/**
 * Địa chỉ của smart contract Certificate trên Blockchain.
 * Được tự động cập nhật bởi scripts/deploy.js sau khi deploy.
 * Nếu deploy thủ công, hãy paste địa chỉ contract vào đây.
 */
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * ABI (Application Binary Interface) của smart contract.
 * ABI mô tả các hàm và event của contract để ethers.js có thể gọi được.
 * Được tự động cập nhật bởi scripts/deploy.js.
 */
const CONTRACT_ABI = [
  // ── Hàm admin ────────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string",  "name": "_certId",        "type": "string"  },
      { "internalType": "string",  "name": "_recipientName", "type": "string"  },
      { "internalType": "bytes32", "name": "_fileHash",      "type": "bytes32" },
      { "internalType": "string",  "name": "_ipfsHash",      "type": "string"  }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_certId", "type": "string" }
    ],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ── Hàm xem dữ liệu (view) ───────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "_certId", "type": "string" }
    ],
    "name": "verifyCertificate",
    "outputs": [
      { "internalType": "bool",   "name": "isValid",   "type": "bool" },
      { "internalType": "bool",   "name": "isRevoked", "type": "bool" },
      {
        "components": [
          { "internalType": "string",  "name": "recipientName", "type": "string"  },
          { "internalType": "string",  "name": "certId",        "type": "string"  },
          { "internalType": "bytes32", "name": "fileHash",      "type": "bytes32" },
          { "internalType": "string",  "name": "ipfsHash",      "type": "string"  },
          { "internalType": "uint256", "name": "issuedAt",      "type": "uint256" },
          { "internalType": "address", "name": "issuedBy",      "type": "address" },
          { "internalType": "bool",    "name": "isRevoked",     "type": "bool"    },
          { "internalType": "bool",    "name": "exists",        "type": "bool"    }
        ],
        "internalType": "struct Certificate.CertificateData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_fileHash", "type": "bytes32" }
    ],
    "name": "verifyByHash",
    "outputs": [
      { "internalType": "string", "name": "certId",   "type": "string" },
      { "internalType": "bool",   "name": "isValid",  "type": "bool"   },
      {
        "components": [
          { "internalType": "string",  "name": "recipientName", "type": "string"  },
          { "internalType": "string",  "name": "certId",        "type": "string"  },
          { "internalType": "bytes32", "name": "fileHash",      "type": "bytes32" },
          { "internalType": "string",  "name": "ipfsHash",      "type": "string"  },
          { "internalType": "uint256", "name": "issuedAt",      "type": "uint256" },
          { "internalType": "address", "name": "issuedBy",      "type": "address" },
          { "internalType": "bool",    "name": "isRevoked",     "type": "bool"    },
          { "internalType": "bool",    "name": "exists",        "type": "bool"    }
        ],
        "internalType": "struct Certificate.CertificateData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_certId", "type": "string" }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "components": [
          { "internalType": "string",  "name": "recipientName", "type": "string"  },
          { "internalType": "string",  "name": "certId",        "type": "string"  },
          { "internalType": "bytes32", "name": "fileHash",      "type": "bytes32" },
          { "internalType": "string",  "name": "ipfsHash",      "type": "string"  },
          { "internalType": "uint256", "name": "issuedAt",      "type": "uint256" },
          { "internalType": "address", "name": "issuedBy",      "type": "address" },
          { "internalType": "bool",    "name": "isRevoked",     "type": "bool"    },
          { "internalType": "bool",    "name": "exists",        "type": "bool"    }
        ],
        "internalType": "struct Certificate.CertificateData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCertificates",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCertIds",
    "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  // ── Events ────────────────────────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "certId",        "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "recipientName", "type": "string"  },
      { "indexed": false, "internalType": "bytes32", "name": "fileHash",      "type": "bytes32" },
      { "indexed": false, "internalType": "address", "name": "issuedBy",      "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "issuedAt",      "type": "uint256" }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "certId",    "type": "string"  },
      { "indexed": false, "internalType": "address", "name": "revokedBy", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "revokedAt", "type": "uint256" }
    ],
    "name": "CertificateRevoked",
    "type": "event"
  }
];

// ============================================================
// CẤU HÌNH PINATA (IPFS)
// ============================================================
// Đăng ký miễn phí tại: https://pinata.cloud
// Tạo API Key tại: https://app.pinata.cloud/keys
// Sau đó thay thế hai giá trị bên dưới:

const PINATA_CONFIG = {
  apiKey:    "YOUR_PINATA_API_KEY",      // ← Thay bằng API Key của bạn
  secretKey: "YOUR_PINATA_SECRET_KEY",   // ← Thay bằng Secret Key của bạn
  gateway:   "https://gateway.pinata.cloud/ipfs/" // URL để truy cập file IPFS
};

// ============================================================
// CẤU HÌNH BLOCKCHAIN
// ============================================================
const BLOCKCHAIN_CONFIG = {
  localRPC:    "http://127.0.0.1:8545",  // Hardhat local node
  chainIdLocal: 31337,                    // Chain ID của Hardhat

  // Sepolia testnet (nếu dùng mạng test thật)
  sepoliaRPC:    "https://rpc.sepolia.org",
  chainIdSepolia: 11155111,

  // URL trang xác thực (dùng để tạo QR code)
  // Thay đổi nếu deploy lên server thật
  verifyBaseUrl: window.location.origin + "/verify.html"
};
