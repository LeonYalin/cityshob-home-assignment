import bcrypt from 'bcryptjs';
import { IUser } from '../models/user.model';

export interface SimpleUser extends IUser {
  id: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

class InMemoryUser implements SimpleUser {
  public id: string;
  public username: string;
  public email: string;
  public password: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(userData: Partial<IUser>) {
    this.id = this.generateId();
    this.username = userData.username || '';
    this.email = userData.email || '';
    this.password = userData.password || '';
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export class InMemoryUserStore {
  private static instance: InMemoryUserStore;
  private users: Map<string, InMemoryUser> = new Map();

  static getInstance(): InMemoryUserStore {
    if (!InMemoryUserStore.instance) {
      InMemoryUserStore.instance = new InMemoryUserStore();
    }
    return InMemoryUserStore.instance;
  }

  async create(userData: Partial<IUser>): Promise<InMemoryUser> {
    // Hash password before storing
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = new InMemoryUser(userData);
    this.users.set(user.id, user);
    return user;
  }

  async findOne(query: { email?: string; username?: string; _id?: string; id?: string }): Promise<InMemoryUser | null> {
    for (const user of this.users.values()) {
      if (query.email && user.email === query.email) {
        return user;
      }
      if (query.username && user.username === query.username) {
        return user;
      }
      if (query._id && user.id === query._id) {
        return user;
      }
      if (query.id && user.id === query.id) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<InMemoryUser | null> {
    return this.users.get(id) || null;
  }

  async find(): Promise<InMemoryUser[]> {
    return Array.from(this.users.values());
  }

  clear(): void {
    this.users.clear();
  }

  size(): number {
    return this.users.size;
  }
}