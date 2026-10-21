import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  width?: string;
  placeholderSrc?: string;
  ratio?: number;
}

export default function ResponsiveImage({
  width,
  ratio = 16 / 9,
  className,
  style,
  placeholderSrc,
  ...props
}: ImageProps) {
  return (
    <div style={{ width: width, ...style }} className="inline-block w-full">
      <AspectRatio ratio={ratio}>
        <LazyLoadImage
          className={cn("w-full h-full object-cover", className)}
          effect="blur"
          placeholderSrc={placeholderSrc}
          {...props}
        />
      </AspectRatio>
    </div>
  );
}
