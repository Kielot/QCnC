import { mockApi } from './mockApi';
import { realApi } from './api';
import type { QCnCApi } from './apiTypes';
export const API_MODE = import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'mock';
export const api: QCnCApi = API_MODE === 'real' ? realApi : mockApi;
