export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginData {
  token: string;
  tokenType?: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}
