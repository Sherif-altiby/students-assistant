// Merge this into your existing express type augmentation file if you
// already have one (don't create two conflicting declarations).

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string; // 'USER' | 'ADMIN' | 'DOCTOR'
      };
    }
  }
}

export {};