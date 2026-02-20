import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

const placeholderImages: ImagePlaceholder[] = data.placeholderImages;

export const PlaceHolderImagesMap = new Map<string, ImagePlaceholder>(
  placeholderImages.map((image) => [image.id, image])
);
