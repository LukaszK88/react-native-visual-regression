// ANSI codes for colors
export const colors = {
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

const log = (message: string | string[], color: keyof typeof colors) => {
  const output = Array.isArray(message) ? message.join(" ") : message;
  console.log(`${colors[color]}${output}${colors.reset}`);
};

export const logGreen = (...message: string[]) => log(message, "green");
export const logBlue = (...message: string[]) => log(message, "blue");
export const logRed = (...message: string[]) => log(message, "red");
