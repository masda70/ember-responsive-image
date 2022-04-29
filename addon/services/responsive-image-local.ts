import { getOwner } from '@ember/application';
import Service, { inject as service } from '@ember/service';
import { assert } from '@ember/debug';
import {
  Meta,
  Image,
  ImageMeta,
  ImageType,
} from 'ember-responsive-image/types';
import ResponsiveImageService from 'ember-responsive-image/services/responsive-image';
import ApplicationInstance from '@ember/application/instance';

const extentionTypeMapping = new Map<string, ImageType>([['jpg', 'jpeg']]);

const imageExtensions: Map<ImageType, string> = new Map([['jpeg', 'jpg']]);

/**
 * Service class to provides images generated by the responsive images package
 */
export default class ResponsiveImageLocalService extends Service {
  @service
  responsiveImage!: ResponsiveImageService;

  rootURL = (
    (getOwner(this) as ApplicationInstance).resolveRegistration(
      'config:environment'
    ) as { rootURL: string }
  ).rootURL;

  /**
   * return the images with the different widths
   */
  getImages(imageName: string, type?: ImageType): Image[] {
    imageName = this.normalizeImageName(imageName);
    const meta = this.getMeta(imageName);
    const images: Image[] = [];

    for (const width of meta.widths) {
      if (type) {
        images.push(this.getImageMetaByWidth(imageName, width, type));
      } else {
        for (const type of meta.formats) {
          images.push(this.getImageMetaByWidth(imageName, width, type));
        }
      }
    }

    return images;
  }

  getAvailableWidths(imageName: string): number[] {
    imageName = this.normalizeImageName(imageName);
    return this.getMeta(imageName).widths;
  }

  getMeta(imageName: string): ImageMeta {
    imageName = this.normalizeImageName(imageName);
    assert(
      `There is no data for image ${imageName}`,
      this.meta.images[imageName]
    );

    return this.meta.images[imageName];
  }

  private normalizeImageName(imageName: string): string {
    return imageName.charAt(0) === '/' ? imageName.slice(1) : imageName;
  }

  public getType(imageName: string): ImageType {
    const extension = imageName.split('.').pop();
    assert(`No extension found for ${imageName}`, extension);
    return extentionTypeMapping.get(extension) ?? (extension as ImageType);
  }

  getAvailableTypes(imageName: string): ImageType[] {
    return this.getMeta(imageName).formats;
  }

  /**
   * returns the image data which fits for given size (in vw)
   */
  getImageMetaBySize(
    imageName: string,
    size?: number,
    type: ImageType = this.getType(imageName)
  ): Image | undefined {
    const width = this.responsiveImage.getDestinationWidthBySize(size ?? 0);
    return this.getImageMetaByWidth(imageName, width, type);
  }

  /**
   * returns the image data which fits for given width (in px)
   */
  getImageMetaByWidth(
    imageName: string,
    width: number,
    type: ImageType = this.getType(imageName)
  ): Image {
    const imageWidth = this.getMeta(imageName).widths.reduce(
      (prevValue: number, w: number) => {
        if (w >= width && prevValue >= width) {
          return w >= prevValue ? prevValue : w;
        } else {
          return w >= prevValue ? w : prevValue;
        }
      },
      0
    );
    const height = Math.round(imageWidth / this.getAspectRatio(imageName));
    return {
      image: this.getImageFilename(imageName, imageWidth, type),
      width: imageWidth,
      type,
      height,
    };
  }

  getAspectRatio(imageName: string): number {
    return this.getMeta(imageName).aspectRatio;
  }

  getImageFilename(image: string, width: number, format: ImageType): string {
    image = this.normalizeImageName(image);
    // this must match `generateFilename()` of ImageWriter broccoli plugin!
    const ext = imageExtensions.get(format) ?? format;
    const base = image.substr(0, image.lastIndexOf('.'));
    const fingerprint = this.getMeta(image).fingerprint;
    return `${this.rootURL}${base}${width}w${
      fingerprint ? '-' + fingerprint : ''
    }.${ext}`;
  }

  get meta(): Meta {
    return this.responsiveImage.meta;
  }
}
