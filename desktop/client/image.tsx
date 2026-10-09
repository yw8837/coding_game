'use client';

// next/image's CommonJS entry exposes a default export wrapper under Vite.
// Select the actual forwardRef component through its explicit named export.
// This keeps Next's image props, loading behavior and ref handling intact.
import {Image} from 'next/dist/client/image-component';

export default Image;
