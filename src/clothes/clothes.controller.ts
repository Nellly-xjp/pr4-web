import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClothesService } from './clothes.service';
import { CreateClothDto } from './dto/create-cloth.dto';
import { UpdateClothDto } from './dto/update-cloth.dto';

@Controller('clothes')
export class ClothesController {
  constructor(private readonly clothesService: ClothesService) {}

  @Get()
  findAll() {
    return this.clothesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clothesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClothDto: CreateClothDto) {
    return this.clothesService.create(createClothDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClothDto: UpdateClothDto) {
    return this.clothesService.update(id, updateClothDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    this.clothesService.remove(id);
  }
}