// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Certificate - Hợp đồng thông minh quản lý chứng chỉ
 * @author Nhóm 6 - Môn Blockchain
 * @notice Hợp đồng này cho phép cấp, thu hồi và xác thực chứng chỉ học tập
 * @dev Sử dụng mapping để lưu trữ dữ liệu chứng chỉ theo certId
 */
contract Certificate {

    // ============================================================
    // KIỂU DỮ LIỆU (DATA TYPES)
    // ============================================================

    /**
     * @dev Cấu trúc lưu trữ thông tin một chứng chỉ
     * @param recipientName  Tên người nhận chứng chỉ
     * @param certId         Mã chứng chỉ duy nhất (primary key)
     * @param fileHash       Mã băm SHA-256 của file PDF (bytes32)
     * @param ipfsHash       CID của file PDF trên mạng IPFS
     * @param issuedAt       Thời điểm cấp (Unix timestamp – giây)
     * @param issuedBy       Địa chỉ ví của người cấp (admin)
     * @param isRevoked      Trạng thái: false = Hợp lệ, true = Đã thu hồi
     * @param exists         Cờ kiểm tra chứng chỉ có tồn tại không
     */
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

    // ============================================================
    // BIẾN TRẠNG THÁI (STATE VARIABLES)
    // ============================================================

    /// @dev Địa chỉ ví của người triển khai hợp đồng = Admin duy nhất
    address public owner;

    /**
     * @dev Mapping từ mã chứng chỉ (string) → dữ liệu chứng chỉ
     *      Lưu trên Blockchain, bất biến và công khai
     */
    mapping(string => CertificateData) private certificates;

    /**
     * @dev Mapping từ fileHash → certId
     *      Giúp tìm chứng chỉ bằng cách hash file PDF
     */
    mapping(bytes32 => string) private hashToCertId;

    /// @dev Mảng lưu tất cả certId đã cấp (để liệt kê danh sách)
    string[] public allCertIds;

    // ============================================================
    // SỰ KIỆN (EVENTS) – được ghi vào log của Blockchain
    // ============================================================

    /// @notice Phát ra khi có chứng chỉ mới được cấp
    event CertificateIssued(
        string  indexed certId,
        string  recipientName,
        bytes32 fileHash,
        address issuedBy,
        uint256 issuedAt
    );

    /// @notice Phát ra khi chứng chỉ bị thu hồi
    event CertificateRevoked(
        string  indexed certId,
        address revokedBy,
        uint256 revokedAt
    );

    // ============================================================
    // MODIFIER – Kiểm tra quyền hạn
    // ============================================================

    /**
     * @dev Modifier chỉ cho phép admin (owner) gọi hàm
     *      Nếu không phải owner → revert với thông báo lỗi
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Chi admin moi co quyen thuc hien");
        _;
    }

    // ============================================================
    // CONSTRUCTOR – Chạy một lần khi deploy
    // ============================================================

    /**
     * @dev Gán người deploy làm owner (admin)
     */
    constructor() {
        owner = msg.sender;
    }

    // ============================================================
    // HÀM GHI DỮ LIỆU (WRITE FUNCTIONS)
    // ============================================================

    /**
     * @notice Cấp chứng chỉ mới lên Blockchain
     * @dev Chỉ admin mới gọi được. Mỗi certId chỉ cấp một lần.
     * @param _certId        Mã chứng chỉ duy nhất (ví dụ: "CERT-2024-001")
     * @param _recipientName Tên người nhận
     * @param _fileHash      Mã băm SHA-256 của file PDF (dạng bytes32)
     * @param _ipfsHash      CID của file trên IPFS
     */
    function issueCertificate(
        string  memory _certId,
        string  memory _recipientName,
        bytes32 _fileHash,
        string  memory _ipfsHash
    ) external onlyOwner {
        // Kiểm tra certId chưa tồn tại
        require(!certificates[_certId].exists, "Chung chi nay da duoc cap truoc do");

        // Kiểm tra hash chưa bị trùng (tránh upload file giống nhau)
        require(
            bytes(hashToCertId[_fileHash]).length == 0,
            "File nay da duoc cap chung chi roi"
        );

        // Lưu thông tin chứng chỉ vào mapping
        certificates[_certId] = CertificateData({
            recipientName: _recipientName,
            certId:        _certId,
            fileHash:      _fileHash,
            ipfsHash:      _ipfsHash,
            issuedAt:      block.timestamp,  // Thời gian hiện tại của block
            issuedBy:      msg.sender,       // Địa chỉ ví admin
            isRevoked:     false,
            exists:        true
        });

        // Tạo index ngược từ hash → certId
        hashToCertId[_fileHash] = _certId;

        // Thêm vào danh sách tổng
        allCertIds.push(_certId);

        // Phát sự kiện lên log Blockchain
        emit CertificateIssued(_certId, _recipientName, _fileHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Thu hồi một chứng chỉ (đánh dấu Revoked)
     * @dev Chứng chỉ đã thu hồi không xóa khỏi Blockchain, chỉ thay đổi cờ isRevoked
     * @param _certId Mã chứng chỉ cần thu hồi
     */
    function revokeCertificate(string memory _certId) external onlyOwner {
        // Kiểm tra chứng chỉ có tồn tại không
        require(certificates[_certId].exists, "Khong tim thay chung chi");

        // Kiểm tra chưa bị thu hồi rồi
        require(!certificates[_certId].isRevoked, "Chung chi nay da bi thu hoi roi");

        // Đánh dấu thu hồi
        certificates[_certId].isRevoked = true;

        // Phát sự kiện lên log
        emit CertificateRevoked(_certId, msg.sender, block.timestamp);
    }

    // ============================================================
    // HÀM ĐỌC DỮ LIỆU (VIEW FUNCTIONS – miễn phí gas)
    // ============================================================

    /**
     * @notice Truy vấn thông tin chứng chỉ theo mã certId
     * @param _certId Mã chứng chỉ cần kiểm tra
     * @return Toàn bộ struct CertificateData
     */
    function getCertificate(string memory _certId)
        external
        view
        returns (CertificateData memory)
    {
        require(certificates[_certId].exists, "Khong tim thay chung chi");
        return certificates[_certId];
    }

    /**
     * @notice Xác thực chứng chỉ: kiểm tra certId có tồn tại và còn hợp lệ không
     * @param _certId Mã chứng chỉ
     * @return isValid   true nếu hợp lệ (tồn tại và chưa thu hồi)
     * @return isRevoked true nếu đã bị thu hồi
     * @return data      Dữ liệu chứng chỉ (nếu tìm thấy)
     */
    function verifyCertificate(string memory _certId)
        external
        view
        returns (
            bool isValid,
            bool isRevoked,
            CertificateData memory data
        )
    {
        // Nếu không tồn tại → trả về false hết
        if (!certificates[_certId].exists) {
            return (false, false, data);
        }

        data = certificates[_certId];
        isRevoked = data.isRevoked;
        isValid = !data.isRevoked; // Hợp lệ khi chưa thu hồi
    }

    /**
     * @notice Tìm chứng chỉ bằng mã băm SHA-256 của file PDF
     * @dev Người dùng upload file → frontend tính hash → gọi hàm này
     * @param _fileHash Mã băm bytes32 của file PDF
     * @return certId   Mã chứng chỉ tìm được (rỗng nếu không tìm thấy)
     * @return isValid  Chứng chỉ còn hợp lệ không
     * @return data     Dữ liệu chứng chỉ đầy đủ
     */
    function verifyByHash(bytes32 _fileHash)
        external
        view
        returns (
            string memory certId,
            bool isValid,
            CertificateData memory data
        )
    {
        certId = hashToCertId[_fileHash];

        // Nếu không tìm thấy hash trong mapping
        if (bytes(certId).length == 0) {
            return ("", false, data);
        }

        data = certificates[certId];
        isValid = !data.isRevoked;
    }

    /**
     * @notice Lấy tổng số chứng chỉ đã cấp
     * @return Số lượng chứng chỉ
     */
    function getTotalCertificates() external view returns (uint256) {
        return allCertIds.length;
    }

    /**
     * @notice Lấy danh sách tất cả certId (dùng để hiển thị trong Admin)
     * @return Mảng các certId
     */
    function getAllCertIds() external view returns (string[] memory) {
        return allCertIds;
    }
}
