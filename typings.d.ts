declare module 'next/image' {
    import type { ImageProps } from 'next/dist/shared/lib/get-img-props';
    import type { DetailedHTMLProps, ImgHTMLAttributes } from 'react';

    const Image: React.FC<ImageProps & DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>>;
    export default Image;
}
