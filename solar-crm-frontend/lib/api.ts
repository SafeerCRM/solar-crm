import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://solar-crm-backend-38n0.onrender.com',
});