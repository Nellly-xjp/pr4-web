import { Injectable } from '@nestjs/common';

@Injectable()
export class SlugService {
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-а-яіїєґ]/gi, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}