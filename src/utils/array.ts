export function splitArrayIntoParts<T>(array: T[], numParts: number) {
  if (numParts <= 0) {
    throw new Error("Number of parts must be greater than 0.");
  }
  const result = [];
  const partSize = Math.ceil(array.length / numParts);

  for (let i = 0; i < array.length; i += partSize) {
    result.push(array.slice(i, i + partSize));
  }

  // Adjust to ensure exact number of parts (if required)
  while (result.length < numParts) {
    result.push([]);
  }

  return result;
}
