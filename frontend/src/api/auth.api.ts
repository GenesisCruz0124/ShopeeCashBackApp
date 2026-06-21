import { AuthUserDTO } from "@shopee-cashback/shared";
import { apiFetch } from "./client";

interface AuthResponse {
  token: string;
  user: AuthUserDTO;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName }) });
}

export function fetchMe(): Promise<AuthUserDTO> {
  return apiFetch("/users/me");
}
