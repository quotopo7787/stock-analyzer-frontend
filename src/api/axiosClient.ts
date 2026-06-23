import axios from "axios";

// Same-origin API path lets Vite proxy /api in development and avoids localhost/127.0.0.1 CORS mismatches.
const axiosClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
