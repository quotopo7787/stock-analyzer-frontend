import axios from "axios";

/**
 * Cấu hình chung để frontend gọi API Spring Boot.
 *
 * Backend Spring Boot của bạn đang chạy ở:
 * http://localhost:8080
 */
const axiosClient = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;