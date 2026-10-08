import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClothesDto } from './dto/create-clothes.dto';
import { UpdateClothesDto } from './dto/update-clothes.dto';
import { randomUUID } from 'crypto';

export interface ClothesItem {
  id: string;
  title: string;
  price: number;
  size: string;
  material: string;
  color: string;
}

@Injectable()
export class ClothesService {
  private items: ClothesItem[] = [
    {
      id: '1',
      title: 'Джинси Slim Fit',
      price: 1500,
      size: 'M',
      material: 'Бавовна',
      color: 'Синій',
    },
    {
      id: '2',
      title: 'Кросівки Running',
      price: 2800,
      size: '42',
      material: 'Сітка/Текстиль',
      color: 'Чорний',
    },
    {
      id: '3',
      title: 'Джинси Oversize',
      price: 1800,
      size: 'L',
      material: 'Бавовна',
      color: 'Блакитний',
    },
  ];

  // Пошук із фільтрацією та пагінацією (limit)
  findAll(search?: string, limit?: number): ClothesItem[] {
    let result = this.items;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) =>
        item.title.toLowerCase().includes(searchLower),
      );
    }

    if (limit && !isNaN(limit)) {
      result = result.slice(0, limit);
    }

    return result;
  }

  findOne(id: string): ClothesItem {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    return item;
  }

  create(dto: CreateClothesDto): ClothesItem {
    const newItem: ClothesItem = {
      id: randomUUID(),
      ...dto,
    };
    this.items.push(newItem);
    return newItem;
  }

  update(id: string, dto: UpdateClothesDto): ClothesItem {
    const itemIndex = this.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }

    const updatedItem = {
      ...this.items[itemIndex],
      ...dto,
    };

    this.items[itemIndex] = updatedItem;
    return updatedItem;
  }

  remove(id: string): void {
    const itemIndex = this.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    this.items.splice(itemIndex, 1);
  }
}