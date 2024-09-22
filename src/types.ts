export type Device = {
  platform: "android" | "ios";
  name: string;
};

export type KindWithNames = Record<string, string[]>;
