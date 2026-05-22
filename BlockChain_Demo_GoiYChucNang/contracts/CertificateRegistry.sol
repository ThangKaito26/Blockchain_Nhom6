// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateRegistry {
    address public owner;

    struct Certificate {
        string certHash;      // Hash of the PDF content
        uint256 issueDate;    // Timestamp
        string issuerName;    // Name of the issuer
        bool isValid;         // Status
        bool exists;          // To check if it exists
    }

    // Mapping from hash to Certificate details
    mapping(string => Certificate) public certificates;

    // Events for tracking history
    event CertificateIssued(string certHash, string issuerName, uint256 issueDate);
    event CertificateRevoked(string certHash, uint256 revokeDate);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // 1. Issue a new certificate
    function issueCertificate(string memory _certHash, string memory _issuerName) public onlyOwner {
        require(!certificates[_certHash].exists, "Certificate already exists!");

        certificates[_certHash] = Certificate({
            certHash: _certHash,
            issueDate: block.timestamp,
            issuerName: _issuerName,
            isValid: true,
            exists: true
        });

        emit CertificateIssued(_certHash, _issuerName, block.timestamp);
    }

    // 2. Revoke a certificate
    function revokeCertificate(string memory _certHash) public onlyOwner {
        require(certificates[_certHash].exists, "Certificate does not exist!");
        require(certificates[_certHash].isValid, "Certificate is already revoked!");

        certificates[_certHash].isValid = false;

        emit CertificateRevoked(_certHash, block.timestamp);
    }

    // 3. Verify a certificate
    function verifyCertificate(string memory _certHash) public view returns (bool exists, bool isValid, string memory issuerName, uint256 issueDate) {
        Certificate memory cert = certificates[_certHash];
        if (!cert.exists) {
            return (false, false, "", 0);
        }
        return (cert.exists, cert.isValid, cert.issuerName, cert.issueDate);
    }
}
