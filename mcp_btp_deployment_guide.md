# Hướng dẫn Triển khai (Deploy) MCP SAP Docs lên SAP BTP Cloud Foundry

Tài liệu này tổng hợp toàn bộ quy trình, các lỗi thường gặp và các Best Practice đã được đúc kết từ thực tiễn khi đưa `mcp-sap-docs` (đặc biệt là biến thể `sap-docs-extend-mcp`) lên môi trường SAP BTP Cloud Foundry. 

Tuân thủ nghiêm ngặt các bước dưới đây sẽ giúp bạn tránh được lỗi "thiếu data" hoặc "không gọi được API ngoài".

---

## Bước 1: Chuẩn bị Dữ liệu (Git Submodules) - ⚠️ RẤT QUAN TRỌNG

Lý do lớn nhất khiến lệnh `sap_search_objects` bị lỗi `ENOENT` trên BTP là do thiếu file từ điển `objectReleaseInfoLatest.json`. Lệnh `npm run setup` sử dụng bash script, do đó thường xuyên bị **lỗi/bỏ qua** nếu chạy trên Windows PowerShell hoặc CMD bình thường.

**Cách khắc phục:**
1. Mở terminal hỗ trợ Bash (ví dụ: **Git Bash**) HOẶC dùng WSL.
2. Chạy lệnh cài đặt tự động:
   ```bash
   npm run setup
   ```
3. **[Dành riêng cho Windows PowerShell]** Nếu không có Bash, bắt buộc phải tải Git Submodule thủ công bằng lệnh sau:
   ```powershell
   git clone --depth 1 https://github.com/SAP/abap-atc-cr-cv-s4hc.git sources/abap-atc-cr-cv-s4hc
   ```
   *(Kiểm tra kỹ thư mục `sources/abap-atc-cr-cv-s4hc/src` phải chứa các file `.json` trước khi sang bước tiếp theo).*

---

## Bước 2: Build Database và Biên dịch TypeScript

Cloud Foundry sẽ chỉ lấy các file trong thư mục `dist/` để chạy ứng dụng (thông qua `nodejs_buildpack`). Nếu quên Build, mã nguồn cũ có lỗi sẽ được đẩy lên BTP.

Chạy lệnh sau để build toàn bộ Typescript và tạo file `docs.sqlite` (BM25 FTS & Embeddings):
```powershell
$env:MCP_VARIANT="sap-docs"
npm run build
```
*(Trên Mac/Linux dùng: `MCP_VARIANT=sap-docs npm run build`)*

---

## Bước 3: Cấu hình `manifest-extend.yml`

Đảm bảo file Manifest của bạn có các thiết lập cốt lõi sau để sử dụng Streamable Server và kết nối qua Supergateway:

```yaml
applications:
- name: sap-docs-extend-mcp
  memory: 1024M
  disk-quota: 6144M
  buildpacks:
    - nodejs_buildpack
  command: npm run start:streamable
  env:
    MCP_VARIANT: sap-docs
    MCP_PRELOAD_EMBEDDINGS: "true"
    NODE_ENV: production
    LOG_LEVEL: INFO
```
**Lưu ý:** Lệnh khởi động bắt buộc phải là `npm run start:streamable`.

---

## Bước 4: Đẩy ứng dụng lên BTP (CF Push)

Đăng nhập vào Cloud Foundry CLI (`cf login`) và trỏ đúng Org/Space. Sau đó chạy lệnh push với file manifest vừa cấu hình:

```bash
cf push -f manifest-extend.yml
```
Đợi đến khi trạng thái trả về là `running`.

---

## Bước 5: Cấu hình Client (Local IDE) & Cấp quyền API Key

Không nên (và không cần thiết) phải nhúng Hardcode các API Key (như Accelerator Hub Key) vào phía Server trên BTP. MCP cho phép Client đẩy Header bảo mật lên Server.

Để đảm bảo **hoạt động ổn định 100% trên mọi thiết bị** (tránh lỗi xung đột phiên bản Node.js cũ v18/v20 hoặc lỗi kết nối mạng của `npx`), khuyến nghị cấu hình theo một trong hai cách dưới đây:

### Yêu cầu đối với thiết bị Client:
1. **Node.js**: Phải cài đặt Node.js phiên bản v18 trở lên.
2. **Kết nối mạng**: Cho phép truy cập internet để gọi API và kết nối tới URL BTP.

### Cách 1: Khóa cứng phiên bản bằng npx (Khuyên dùng - Đơn giản nhất)
Sử dụng `supergateway@2.0.0` và tham số `--sse` thay thế cho cấu hình cũ:

```json
"sap-docs-extend-mcp": {
  "command": "npx",
  "args": [
    "-y",
    "supergateway@2.0.0",
    "--sse",
    "https://sap-docs-extend-mcp.cfapps.ap21.hana.ondemand.com/sse",
    "--header",
    "SAP-API-HUB-KEY: <ĐIỀN_API_KEY_CỦA_TỪNG_USER_VÀO_ĐÂY>"
  ],
  "disabled": false,
  "autoApprove": []
}
```

### Cách 2: Cài đặt toàn cục (Cực kỳ ổn định & Tránh lỗi Proxy/Firewall)
1. Cài đặt `supergateway` lên máy khách một lần duy nhất:
   ```bash
   npm install -g supergateway@2.0.0
   ```
2. Cấu hình IDE sử dụng trực tiếp:
   ```json
   "sap-docs-extend-mcp": {
     "command": "supergateway",
     "args": [
       "--sse",
       "https://sap-docs-extend-mcp.cfapps.ap21.hana.ondemand.com/sse",
       "--header",
       "SAP-API-HUB-KEY: <ĐIỀN_API_KEY_CỦA_TỪNG_USER_VÀO_ĐÂY>"
     ],
     "disabled": false,
     "autoApprove": []
   }
   ```
   *(Lưu ý trên Windows: Nếu IDE không tìm thấy lệnh `supergateway`, hãy dùng `supergateway.cmd` hoặc điền đường dẫn tuyệt đối).*

### Các Lỗi Đã Được Khắc Phục Ở Source Code (Để Tham Khảo)
Nếu bạn lấy Source code từ bản gốc trên Github, lưu ý 2 lỗi nghiêm trọng sau đã được fix trong nhánh này:
1. **Lỗi truyền Body ở Supergateway (`stream is not readable`)**: 
   - Đã sửa tại `src/streamable-http-server.ts`. Không pass raw stream vào `handlePostMessage` mà truyền thẳng `req.body` (vì Express đã parse ra JSON rồi).
2. **Lỗi sai đường dẫn thư mục Gốc (Project Root) trên BTP**:
   - Đã tạo cơ chế nhận diện Root động tại `src/lib/projectRoot.ts` để thay thế cho `path.resolve(__dirname, "../../..")`. Nếu không có file này, các tool đọc file `.json` sẽ bị dính lỗi đường dẫn `dist/sources/...`.
