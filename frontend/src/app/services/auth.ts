import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id?: number;
    email: string;
    username?: string;
    role?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password_hash: string }): Observable<LoginResponse> {
    const body = {
      email: credentials.email,
      password: credentials.password_hash
    };
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body);
  }
}