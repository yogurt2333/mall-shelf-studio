export const productAssetDirectory = "assets/products";

export function createProductImageAssetPath(originalFileName: string, date: Date, sequence: number) {
  const extension = getSafeExtension(originalFileName);
  const timestamp = [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0"),
    date.getSeconds().toString().padStart(2, "0"),
  ].join("");

  return `${productAssetDirectory}/product_${timestamp}_${sequence
    .toString()
    .padStart(3, "0")}${extension}`;
}

function getSafeExtension(fileName: string) {
  const extension = fileName.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase();

  return extension ?? ".png";
}
