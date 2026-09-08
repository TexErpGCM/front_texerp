export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginData {
  accessToken: string;
  tokenType?: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}
