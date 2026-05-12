export type AdminLoginBody = { email: string; password: string };

export type AdminLoginResponse = {
  success?: boolean;
  message?: string;
  requires_2fa?: boolean;
  accessToken?: string;
  refreshToken?: string;
};

export type AdminVerifyOtpBody = { email: string; otp: string };
export type AdminResendOtpBody = { email: string };

export type AdminTokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AdminRefreshBody = { refreshToken: string };

export type AdminForgotPasswordBody = { email: string };

export type AdminInvitationCreateBody = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type AdminInvitationValidateResponse = {
  valid: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export type AdminInvitationAcceptBody = { token: string; password: string };

export type AdminPasswordResetApproveBody = { requestId: string };

export type AdminPasswordResetResetBody = { token: string; newPassword: string };

export type ApiErrorBody = {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};
