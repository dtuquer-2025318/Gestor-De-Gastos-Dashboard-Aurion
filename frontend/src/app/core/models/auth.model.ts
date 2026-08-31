export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}