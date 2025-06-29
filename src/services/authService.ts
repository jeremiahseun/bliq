import CryptoJS from 'crypto-js';
import { dbService } from './dbService';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

class AuthService {
  private currentUser: User | null = null;

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    const userId = localStorage.getItem('bliq-user-id');
    if (!userId) {
      return null;
    }

    try {
      const user = await dbService.getUser(userId);
      if (user) {
        this.currentUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        };
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      localStorage.removeItem('bliq-user-id');
    }

    return null;
  }

  async login(email: string, password: string): Promise<User | null> {
    try {
      const users = await dbService.getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        throw new Error('User not found');
      }

      const passwordHash = CryptoJS.SHA256(password + user.id).toString();
      if (passwordHash !== user.passwordHash) {
        throw new Error('Invalid password');
      }

      const authenticatedUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };

      this.currentUser = authenticatedUser;
      localStorage.setItem('bliq-user-id', user.id);
      
      return authenticatedUser;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async signup(email: string, password: string, name: string): Promise<User | null> {
    try {
      // Check if user already exists
      const users = await dbService.getAllUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw new Error('User already exists');
      }

      const userId = crypto.randomUUID();
      const passwordHash = CryptoJS.SHA256(password + userId).toString();
      
      const newUser: StoredUser = {
        id: userId,
        email: email.toLowerCase(),
        name,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      await dbService.addUser(newUser);

      const authenticatedUser: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
      };

      this.currentUser = authenticatedUser;
      localStorage.setItem('bliq-user-id', userId);
      
      return authenticatedUser;
    } catch (error) {
      console.error('Signup error:', error);
      return null;
    }
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('bliq-user-id');
  }
}

export const authService = new AuthService();