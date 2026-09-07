import { createSocialImage } from "./social-image";

export const alt = "3DCRAFTS custom 3D printing and laser craft in Edinburgh";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createSocialImage(size);
}
