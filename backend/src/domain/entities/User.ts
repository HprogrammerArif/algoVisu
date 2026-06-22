export interface User {
  id: number;
  roleId: number;
  role: string;
  fullName: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
}

export interface PublicUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
}
