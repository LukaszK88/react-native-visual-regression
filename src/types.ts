export type Platform = "android" | "ios";

export type Device = {
  platform: Platform;
  name: string;
  devices?: number; 
};

export type KindWithNames = Record<string, string[]>;

export interface Story {
  kind: string;
  name: string;
  fullName: string;
}
