import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Cloth } from './entities/cloth.entity';
import { CreateClothDto } from './dto/create-cloth.dto';
import { UpdateClothDto } from './dto/update-cloth.dto';
import { SlugService } from '../shared/slug.service';

@Injectable()
export class ClothesService implements OnModuleInit {
  private readonly logger = new Logger(ClothesService.name);
  private items: Cloth[] = [];

  constructor(private readonly slugService: SlugService) {}

  onModuleInit() {
    this.logger.log('ClothesService ініціалізовано. Завантаження початкових даних...');

    const initialClothes: CreateClothDto[] = [
      {
        title: 'Oversize Hoodie',
        price: 1850,
        size: 'L',
        material: 'Cotton',
        color: 'Black',
      },
      {
        title: 'Classic Leather Sneakers',
        price: 3400,
        size: '42',
        material: 'Leather',
        color: 'White',
      },
      {
        title: 'Straight Denim Jeans',
        price: 2200,
        size: '32/32',
        material: 'Denim',
        color: 'Blue',
      },
    ];

    initialClothes.forEach((dto, idx) => {
      this.items.push({
        id: String(idx + 1),
        slug: this.slugService.generateSlug(`${dto.title}-${dto.color}`),
        ...dto,
      });
    });

    this.logger.log(`У каталог додано ${this.items.length} товарів.`);
  }

  findAll(): Cloth[] {
    return this.items;
  }

  findOne(id: string): Cloth {
    const item = this.items.find((cloth) => cloth.id === id);
    if (!item) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    return item;
  }

  create(dto: CreateClothDto): Cloth {
    const newItem: Cloth = {
      id: randomUUID(),
      slug: this.slugService.generateSlug(`${dto.title}-${dto.color}`),
      ...dto,
    };
    this.items.push(newItem);
    return newItem;
  }

  update(id: string, dto: UpdateClothDto): Cloth {
    const existing = this.findOne(id);
    const updatedTitle = dto.title ?? existing.title;
    const updatedColor = dto.color ?? existing.color;

    const updatedItem: Cloth = {
      ...existing,
      ...dto,
      slug:
        dto.title || dto.color
          ? this.slugService.generateSlug(`${updatedTitle}-${updatedColor}`)
          : existing.slug,
    };

    const index = this.items.findIndex((cloth) => cloth.id === id);
    this.items[index] = updatedItem;
    return updatedItem;
  }

  remove(id: string): void {
    const index = this.items.findIndex((cloth) => cloth.id === id);
    if (index === -1) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    this.items.splice(index, 1);
  }
}