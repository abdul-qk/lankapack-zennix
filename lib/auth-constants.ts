export const USER_LEVELS = {
  ADMIN: "Admin",
  GENERAL: "General",
} as const;

export type UserLevel = (typeof USER_LEVELS)[keyof typeof USER_LEVELS];
