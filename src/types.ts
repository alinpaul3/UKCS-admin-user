export interface User {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  role: 'admin' | 'user';
  enrollmentId?: string;
  createdAt: string | number;
}

export interface Certificate {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  certificateName?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  userId: string;
  userName?: string;
  userEnrollmentId?: string;
  userEmail?: string;
  uploadedBy: string;
  publicId?: string;
  createdAt: string | number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
