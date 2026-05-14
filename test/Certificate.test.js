// test/Certificate.test.js (CommonJS – Hardhat v2)
const { expect }  = require("chai");
const { ethers }  = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Certificate Contract", function () {
  let certificate, owner, user1;

  const CERT_ID    = "CERT-2024-001";
  const CERT_ID_2  = "CERT-2024-002";
  const RECIPIENT  = "Nguyen Van A";
  const IPFS_HASH  = "QmTest1234567890";
  const FILE_HASH  = ethers.keccak256(ethers.toUtf8Bytes("fake-pdf-1"));
  const FILE_HASH_2= ethers.keccak256(ethers.toUtf8Bytes("fake-pdf-2"));

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("Certificate");
    certificate = await Factory.deploy();
    await certificate.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Owner phải là deployer", async function () {
      expect(await certificate.owner()).to.equal(owner.address);
    });
    it("Ban đầu 0 chứng chỉ", async function () {
      expect(await certificate.getTotalCertificates()).to.equal(0n);
    });
  });

  describe("issueCertificate", function () {
    it("Admin cấp thành công và emit event", async function () {
      await expect(certificate.issueCertificate(CERT_ID, RECIPIENT, FILE_HASH, IPFS_HASH))
        .to.emit(certificate, "CertificateIssued")
        .withArgs(CERT_ID, RECIPIENT, FILE_HASH, owner.address, anyValue);
    });
    it("Lưu đúng thông tin", async function () {
      await certificate.issueCertificate(CERT_ID, RECIPIENT, FILE_HASH, IPFS_HASH);
      const data = await certificate.getCertificate(CERT_ID);
      expect(data.recipientName).to.equal(RECIPIENT);
      expect(data.isRevoked).to.equal(false);
      expect(data.exists).to.equal(true);
    });
    it("Từ chối certId trùng", async function () {
      await certificate.issueCertificate(CERT_ID, RECIPIENT, FILE_HASH, IPFS_HASH);
      await expect(certificate.issueCertificate(CERT_ID, "Other", FILE_HASH_2, IPFS_HASH))
        .to.be.revertedWith("Chung chi nay da duoc cap truoc do");
    });
    it("Từ chối file hash trùng", async function () {
      await certificate.issueCertificate(CERT_ID, RECIPIENT, FILE_HASH, IPFS_HASH);
      await expect(certificate.issueCertificate(CERT_ID_2, "Other", FILE_HASH, IPFS_HASH))
        .to.be.revertedWith("File nay da duoc cap chung chi roi");
    });
    it("User không thể cấp", async function () {
      await expect(certificate.connect(user1).issueCertificate(CERT_ID, RECIPIENT, FILE_HASH, IPFS_HASH))
        .to.be.revertedWith("Chi admin moi co quyen thuc hien");
    });
  });

  describe("revokeCertificate", function () {
    beforeEach(async function () {
      await certificate.issueCertificate(CERT_ID, RECIPIENT, FILE_HASH, IPFS_HASH);
    });
    it("Admin thu hồi và emit event", async function () {
      await expect(certificate.revokeCertificate(CERT_ID))
        .to.emit(certificate, "CertificateRevoked");
    });
    it("isRevoked = true sau thu hồi", async function () {
      await certificate.revokeCertificate(CERT_ID);
      const data = await certificate.getCertificate(CERT_ID);
      expect(data.isRevoked).to.equal(true);
    });
    it("Không thu hồi 2 lần", async function () {
      await certificate.revokeCertificate(CERT_ID);
      await expect(certificate.revokeCertificate(CERT_ID))
        .to.be.revertedWith("Chung chi nay da bi thu hoi roi");
    });
    it("User không thể thu hồi", async function () {
      await expect(certificate.connect(user1).revokeCertificate(CERT_ID))
        .to.be.revertedWith("Chi admin moi co quyen thuc hien");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      await certificate.issueCertificate(CERT_ID, RECIPIENT, FILE_HASH, IPFS_HASH);
    });
    it("Hợp lệ → isValid=true", async function () {
      const [isValid, isRevoked] = await certificate.verifyCertificate(CERT_ID);
      expect(isValid).to.equal(true);
      expect(isRevoked).to.equal(false);
    });
    it("Đã thu hồi → isValid=false", async function () {
      await certificate.revokeCertificate(CERT_ID);
      const [isValid, isRevoked] = await certificate.verifyCertificate(CERT_ID);
      expect(isValid).to.equal(false);
      expect(isRevoked).to.equal(true);
    });
    it("Không tồn tại → isValid=false", async function () {
      const [isValid] = await certificate.verifyCertificate("FAKE");
      expect(isValid).to.equal(false);
    });
    it("verifyByHash tìm đúng", async function () {
      const [certId, isValid] = await certificate.verifyByHash(FILE_HASH);
      expect(certId).to.equal(CERT_ID);
      expect(isValid).to.equal(true);
    });
    it("verifyByHash hash lạ → rỗng", async function () {
      const [certId, isValid] = await certificate.verifyByHash(
        ethers.keccak256(ethers.toUtf8Bytes("invalid"))
      );
      expect(certId).to.equal("");
      expect(isValid).to.equal(false);
    });
  });
});
