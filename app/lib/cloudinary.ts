/**
 * Injects Cloudinary transformation parameters into a standard Cloudinary delivery URL.
 * Keeps transformations locked to 2 consistent widths (600px grid, 1600px lightbox)
 * to maximize CDN cache hits and minimize Cloudinary credit usage.
 */
export function buildCloudinaryUrl(
  secureUrl: string,
  width: number
): string {
  if (!secureUrl.includes("/image/upload/")) {
    return secureUrl;
  }
  const transform = `f_auto,q_auto,w_${width},c_limit`;
  return secureUrl.replace("/image/upload/", `/image/upload/${transform}/`);
}
