import axios from 'axios';

let isRedirecting = false;

export function setupAxiosInterceptor() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;

      if (status === 401) {
        console.warn('401 Unauthorized detected');

        const token =
          localStorage.getItem('token') ||
          localStorage.getItem('access_token');

        // ✅ ONLY logout if token is actually missing
        if (!token && !isRedirecting) {
          isRedirecting = true;
          localStorage.clear();
          window.location.href = '/';
        }
      }

      return Promise.reject(error);
    },
  );
}