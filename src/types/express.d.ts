export type AuthUser = {
  id: number;
  email: string;
  role: string;
};

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

export {};
