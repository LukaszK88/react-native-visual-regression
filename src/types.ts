export type Device = {
  platform: "android" | "ios";
  name: string;
};

export type KindWithNames = Record<string, string[]>;

export interface Story {
  kind: string;
  name: string;
  fullName: string;
}
