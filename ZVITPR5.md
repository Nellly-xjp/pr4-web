# Звіт до Практичної роботи № 5
**Виконала** Тирканич Корнелія з групи КН-41
**Тема:** Модульна архітектура та ін’єкція залежностей у NestJS  
**Варіант 3:** Одяг та взуття (`/clothes` — поля `title`, `price`, `size`, `material`, `color`)  
**Рівень складності:** Рівень 2 (повний REST CRUD, HTTP-статуси та In-Memory Service)

---

## 1. Мета роботи
- Опанувати принципи побудови модульної архітектури серверних додатків на базі NestJS: поділ системи на ізольовані функціональні модулі (`feature modules`) та спільні утилітарні модулі (`shared modules`).
- Засвоїти механізми ін’єкції залежностей (`Dependency Injection`): експорт та імпорт сервісів між модулями через метадані `@Module({ imports, exports })`.
- Навчитися створювати кастомні провайдери (`custom providers`) із застосуванням стратегій `useValue` та `useFactory`, рядкових токенів ін’єкції та декоратора `@Inject()`.
- Опанувати роботу з життєвим циклом компонентів NestJS через хук `OnModuleInit`.

---

## 2. Архітектура та структура проєкту

Монолітну структуру з попередніх робіт реорганізовано у слабко зв’язану модульну архітектуру, де кореневий модуль `AppModule` виконує виключно роль агрегатора модулів:

```text
src/
├── shared/                        # Спільний утилітарний модуль (SharedModule)
│   ├── constants/
│   │   └── tokens.ts              # Токени ін'єкції (APP_CONFIG, NOTIFICATION_CLIENT) та інтерфейси
│   ├── providers/
│   │   └── custom.providers.ts    # Кастомні провайдери (useValue та useFactory)
│   ├── slug.service.ts            # Утилітарний сервіс генерації URL-slug
│   └── shared.module.ts
├── clothes/                       # Основний Feature Module (Варіант 3: Одяг та взуття)
│   ├── dto/
│   │   ├── create-cloth.dto.ts
│   │   └── update-cloth.dto.ts
│   ├── entities/
│   │   └── cloth.entity.ts
│   ├── clothes.controller.ts      # REST CRUD контролер (/clothes)
│   ├── clothes.service.ts         # In-Memory сховище + OnModuleInit
│   └── clothes.module.ts
├── orders/                        # Другий Feature Module (Замовлення)
│   ├── dto/
│   │   └── create-order.dto.ts
│   ├── entities/
│   │   └── order.entity.ts
│   ├── orders.controller.ts       # Контролер замовлень (/orders)
│   ├── orders.service.ts          # Взаємодія з ClothesService, APP_CONFIG та NOTIFICATION_CLIENT
│   └── orders.module.ts
├── app.module.ts                  # Кореневий модуль додатка
└── main.ts                        # Точка входу



# 1. Опис виконання Рівня 1. Базовий

## 1.1. Ініціалізація проєкту за допомогою CLI

Для створення базової структури проєкту зі суворою типізацією TypeScript (`--strict`) та пакетним менеджером `npm` було виконано команду NestJS CLI:

```bash
npx @nestjs/cli new online-store --strict --package-manager npm
```

Після створення проєкту та встановлення всіх необхідних залежностей сервер було запущено в режимі розробки з автоматичним перезавантаженням при зміні файлів:

```bash
npm run start:dev
```

Працездатність базового маршруту перевірено за адресою:

```text
http://localhost:3000
```

У результаті отримано стандартну відповідь `Hello World!` від `AppController`, що підтверджує успішний запуск NestJS-застосунку.

## 1.2. Генерація контролера предметної області

Відповідно до Варіанта 3 було створено контролер для роботи з ресурсом `clothes`.

Для генерації контролера без файлу модульних тестів використано команду:

```bash
npx @nestjs/cli g co clothes --no-spec
```

У результаті створено файл:

```text
src/clothes/clothes.controller.ts
```

У контролері використовується декоратор `@Controller('clothes')`, який визначає базовий маршрут для всіх операцій із товарами одягу та взуття.

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('clothes')
export class ClothesController {

  @Get()
  findAll() {
    return 'Список усіх товарів';
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `Товар з ID: ${id}`;
  }

  @Post()
  create(@Body() body: any) {
    return body;
  }
}
```

На цьому етапі реалізовано три базові HTTP-ендпоінти:

- `GET /clothes` — отримання списку товарів;
- `GET /clothes/:id` — отримання конкретного товару;
- `POST /clothes` — створення нового товару.

## 1.3. Створення контрактів DTO (Data Transfer Objects)

Для типізації та чіткого визначення структури вхідних даних створено каталог:

```text
src/clothes/dto/
```

У ньому розміщено два класи контрактів.

**Файл `create-cloth.dto.ts`**

Містить усі обов'язкові поля для створення нової позиції одягу або взуття.

```typescript
export class CreateClothDto {
  title!: string;
  price!: number;
  size!: string;
  material!: string;
  color!: string;
}
```

**Файл `update-cloth.dto.ts`**

Містить опціональні поля, що дозволяє виконувати часткове оновлення запису за допомогою HTTP-методу PATCH.

```typescript
export class UpdateClothDto {
  title?: string;
  price?: number;
  size?: string;
  material?: string;
  color?: string;
}
```

Також у каталозі `src/clothes/entities/` створено файл `cloth.entity.ts`, у якому описано модель предметної сутності `Cloth`.

Модель додатково містить унікальний ідентифікатор `id` та URL-сумісний ідентифікатор `slug`.

```typescript
export class Cloth {
  id!: string;
  title!: string;
  price!: number;
  size!: string;
  material!: string;
  color!: string;
  slug!: string;
}
```

## 1.4. Реалізація базових методів контролера

У файлі `src/clothes/clothes.controller.ts` оголошено обробники HTTP-запитів із використанням декораторів NestJS.

Основні декоратори:

- `@Get()` — повертає повний список товарів одягу та взуття.
- `@Get(':id')` — отримує динамічний параметр маршруту через `@Param('id')` та повертає конкретний товар.
- `@Post()` — приймає JSON-тіло запиту через `@Body()` та створює нову позицію товару.

Таким чином, на першому рівні створено базову структуру NestJS-проєкту, контролер предметної області та DTO-контракти для роботи з товарами.

---

# 2. Опис виконання Рівня 2. Повний REST CRUD, HTTP-статуси та In-Memory Service

## 2.1. Створення сервісного провайдера (Service Provider)

Для винесення бізнес-логіки та роботи зі сховищем даних із контролера було створено окремий сервіс за допомогою NestJS CLI:

```bash
npx @nestjs/cli g s clothes --no-spec
```

У результаті створено файл:

```text
src/clothes/clothes.service.ts
```

У класі `ClothesService` реалізовано приватне сховище товарів в оперативній пам'яті:

```typescript
private items: Cloth[] = [];
```

Для автоматичного заповнення сховища під час запуску застосунку сервіс реалізує інтерфейс `OnModuleInit`.

Метод `onModuleInit()` додає три початкові тестові позиції:

1. Oversize Hoodie.
2. Classic Leather Sneakers.
3. Straight Denim Jeans.

Для кожного товару генерується унікальний `slug` за допомогою спільного сервісу `SlugService`.

## 2.2. Реалізація методів сервісу з обробкою виключень

У `ClothesService` реалізовано всі п'ять методів повного CRUD-циклу.

### 1. findAll()

Повертає повний масив товарів, які зберігаються в оперативній пам'яті.

```typescript
findAll(): Cloth[] {
  return this.items;
}
```

### 2. findOne(id: string)

Здійснює пошук товару за ідентифікатором за допомогою методу `.find()`.

Якщо товар із переданим ID відсутній, генерується стандартне HTTP-виключення NestJS `NotFoundException`, яке повертає статус `404 Not Found`.

```typescript
findOne(id: string): Cloth {
  const item = this.items.find((cloth) => cloth.id === id);

  if (!item) {
    throw new NotFoundException(
      `Сутність з ID ${id} не знайдена`,
    );
  }

  return item;
}
```

### 3. create(dto: CreateClothDto)

Створює новий товар на основі отриманих даних.

Для генерації унікального ідентифікатора використовується `randomUUID()` із вбудованого модуля `crypto`.

Після створення об'єкт додається до масиву `this.items`.

```typescript
create(dto: CreateClothDto): Cloth {
  const item: Cloth = {
    id: randomUUID(),
    ...dto,
    slug: this.slugService.generate(dto.title),
  };

  this.items.push(item);

  return item;
}
```

### 4. update(id: string, dto: UpdateClothDto)

Виконує часткове оновлення інформації про товар.

Спочатку перевіряється існування товару через `this.findOne(id)`. Якщо запис відсутній, автоматично генерується `NotFoundException`.

Для об'єднання старих та нових полів використовується spread-оператор:

```typescript
const updated = {
  ...existing,
  ...dto,
};
```

Якщо змінюється назва товару, повторно генерується його `slug`.

```typescript
update(id: string, dto: UpdateClothDto): Cloth {
  const existing = this.findOne(id);

  const updated = {
    ...existing,
    ...dto,
  };

  if (dto.title) {
    updated.slug = this.slugService.generate(dto.title);
  }

  const index = this.items.findIndex(
    (cloth) => cloth.id === id,
  );

  this.items[index] = updated;

  return updated;
}
```

### 5. remove(id: string)

Видаляє товар із масиву за його ідентифікатором.

Для пошуку позиції використовується метод `.findIndex()`.

Якщо індекс дорівнює `-1`, генерується `NotFoundException`. Якщо товар знайдено, він видаляється методом `.splice(index, 1)`.

```typescript
remove(id: string): void {
  const index = this.items.findIndex(
    (cloth) => cloth.id === id,
  );

  if (index === -1) {
    throw new NotFoundException(
      `Товар з ID ${id} не знайдено`,
    );
  }

  this.items.splice(index, 1);
}
```

## 2.3. Підключення сервісу до контролера (Dependency Injection)

Для відокремлення контролера від бізнес-логіки використано механізм ін'єкції залежностей (Dependency Injection).

У файлі `src/clothes/clothes.controller.ts` сервіс підключено через конструктор:

```typescript
constructor(
  private readonly clothesService: ClothesService,
) {}
```

Завдяки цьому контролер не працює безпосередньо з масивом товарів, а делегує всі операції сервісу `ClothesService`.

## 2.4. Реалізація повного REST CRUD та HTTP-статусів

У контролері реалізовано п'ять основних HTTP-операцій.

| HTTP-метод | Маршрут | Призначення |
|---|---|---|
| GET | `/clothes` | Отримання всіх товарів |
| GET | `/clothes/:id` | Отримання товару за ID |
| POST | `/clothes` | Створення нового товару |
| PATCH | `/clothes/:id` | Часткове оновлення товару |
| DELETE | `/clothes/:id` | Видалення товару |

Для правильного відображення результатів запитів налаштовано HTTP-статуси:

- `200 OK` — успішне отримання або оновлення товару.
- `201 Created` — успішне створення нового товару.
- `204 No Content` — успішне видалення без повернення тіла відповіді.
- `404 Not Found` — товар із вказаним ідентифікатором не знайдено.

Для створення товару використовується:

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
create(@Body() dto: CreateClothDto) {
  return this.clothesService.create(dto);
}
```

Для часткового оновлення:

```typescript
@Patch(':id')
update(
  @Param('id') id: string,
  @Body() dto: UpdateClothDto,
) {
  return this.clothesService.update(id, dto);
}
```

Для видалення:

```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
remove(@Param('id') id: string) {
  this.clothesService.remove(id);
}
```

Таким чином, було реалізовано повний REST CRUD із відповідною обробкою HTTP-статусів та виключень.

---

# 3. Модульна декомпозиція та Custom Providers (Практична робота № 5)

Для усунення монолітності кореневого `AppModule` проєкт було реорганізовано за принципом модульної архітектури.

Основна мета — розділити функціональність застосунку на незалежні модулі, забезпечити повторне використання компонентів та реалізувати ін'єкцію залежностей через власні провайдери (Custom Providers).

## 3.1. Структура модулів проєкту

У проєкті реалізовано три основні модулі:

### 1. SharedModule (src/shared/)

Спільний утилітарний модуль, який містить компоненти, доступні для повторного використання в інших модулях.

Основні елементи:

- `SlugService` — сервіс для генерації зрозумілих URL-ідентифікаторів товарів.
- `APP_CONFIG` — кастомний провайдер, створений за допомогою `useValue`.
- `NOTIFICATION_CLIENT` — кастомний провайдер, створений за допомогою `useFactory`.

Провайдер `APP_CONFIG` зберігає основні налаштування магазину:

- назву магазину;
- середовище виконання;
- валюту `UAH`;
- ставку ПДВ `0.20`.

Приклад налаштування:

```typescript
export const APP_CONFIG = 'APP_CONFIG';

export const appConfig = {
  storeName: 'Online Store',
  environment: 'development',
  currency: 'UAH',
  vatRate: 0.20,
};
```

Для реєстрації провайдера використовується стратегія `useValue`:

```typescript
{
  provide: APP_CONFIG,
  useValue: appConfig,
}
```

### 2. Custom Provider useFactory

Для створення сервісу надсилання електронних чеків використовується фабричний провайдер `NOTIFICATION_CLIENT`.

Він створюється за допомогою `useFactory`, а його залежності передаються через масив `inject: [APP_CONFIG]`.

```typescript
{
  provide: NOTIFICATION_CLIENT,
  useFactory: (config) => {
    return {
      sendReceipt: (order) => {
        return `Чек магазину ${config.storeName}`;
      },
    };
  },
  inject: [APP_CONFIG],
}
```

Таким чином, фабричний провайдер отримує конфігурацію магазину та динамічно формує клієнт для роботи з повідомленнями.

У `SharedModule` всі спільні компоненти реєструються та експортуються через масив `exports`:

```typescript
@Module({
  providers: [
    SlugService,
    {
      provide: APP_CONFIG,
      useValue: appConfig,
    },
    {
      provide: NOTIFICATION_CLIENT,
      useFactory: (config) => {
        return {
          sendReceipt: (order) =>
            `Чек магазину ${config.storeName}`,
        };
      },
      inject: [APP_CONFIG],
    },
  ],
  exports: [
    SlugService,
    APP_CONFIG,
    NOTIFICATION_CLIENT,
  ],
})
export class SharedModule {}
```

### 3.2. ClothesModule (src/clothes/)

Функціональний модуль каталогу товарів одягу та взуття.

Його основні завдання:

- імпорт `SharedModule` для використання `SlugService`;
- реєстрація `ClothesController`;
- реєстрація `ClothesService`;
- експорт `ClothesService` для використання іншими модулями.

Приклад конфігурації:

```typescript
@Module({
  imports: [SharedModule],
  controllers: [ClothesController],
  providers: [ClothesService],
  exports: [ClothesService],
})
export class ClothesModule {}
```

Завдяки експорту `ClothesService` інші модулі можуть отримувати доступ до каталогу товарів без дублювання бізнес-логіки.

### 3.3. OrdersModule (src/orders/)

Функціональний модуль оформлення замовлень.

Він імпортує:

- `ClothesModule` — для доступу до каталогу товарів;
- `SharedModule` — для отримання конфігурації та клієнта повідомлень.

У `OrdersService` впроваджуються такі залежності:

- `ClothesService` — перевіряє наявність товару та отримує його ціну;
- `APP_CONFIG` — використовується для отримання налаштувань магазину та ставки ПДВ;
- `NOTIFICATION_CLIENT` — використовується для формування електронного чека.

Приклад ін'єкції кастомних провайдерів:

```typescript
constructor(
  private readonly clothesService: ClothesService,

  @Inject(APP_CONFIG)
  private readonly config: AppConfig,

  @Inject(NOTIFICATION_CLIENT)
  private readonly notificationClient: NotificationClient,
) {}
```

Під час оформлення замовлення система перевіряє наявність товару в каталозі, отримує його ціну, розраховує суму з урахуванням ПДВ та формує електронний чек.

Формула розрахунку вартості:

```typescript
const totalWithVat =
  cloth.price * (1 + this.config.vatRate);
```

Таким чином, `OrdersModule` використовує функціональність інших модулів через Dependency Injection.

### 3.4. AppModule — кореневий модуль

Файл `src/app.module.ts` виконує роль головного модуля, який об'єднує всі функціональні частини застосунку.

Він підключає:

- `SharedModule`;
- `ClothesModule`;
- `OrdersModule`;
- `ObserveModule` — модуль моніторингу.

Приклад структури:

```typescript
@Module({
  imports: [
    SharedModule,
    ClothesModule,
    OrdersModule,
    ObserveModule,
  ],
})
export class AppModule {}
```

Завдяки такій організації кожен модуль відповідає за власну частину функціональності, що полегшує підтримку, тестування та подальше розширення проєкту.

---

# 4. Зведена таблиця реалізованих API-ендпоінтів

| HTTP-метод | Маршрут | Призначення | Статус відповіді |
|---|---|---|---|
| GET | `/clothes` | Отримати список усіх товарів | 200 OK |
| GET | `/clothes/:id` | Отримати один товар за ID | 200 OK / 404 Not Found |
| POST | `/clothes` | Додати новий товар у каталог | 201 Created |
| PATCH | `/clothes/:id` | Частково оновити дані товару | 200 OK / 404 Not Found |
| DELETE | `/clothes/:id` | Видалити товар із каталогу | 204 No Content / 404 Not Found |
| POST | `/orders` | Оформити замовлення | 201 Created / 404 Not Found |
| GET | `/orders` | Отримати список усіх замовлень | 200 OK |

---

# 5. Інструкція із запуску та тестування

## 5.1. Встановлення залежностей

Для встановлення всіх необхідних залежностей потрібно виконати команду в терміналі:

```bash
npm install
```

## 5.2. Запуск сервера

Для запуску NestJS-застосунку в режимі розробки використовується команда:

```bash
npm run start:dev
```

Після успішного запуску сервер буде доступний за адресою:

```text
http://localhost:3000
```

## 5.3. Тестування API

Для тестування реалізованих ендпоінтів створено файл `requests.http`.

У Visual Studio Code його можна відкрити та виконувати підготовлені HTTP-запити за допомогою розширення **REST Client**.

Для надсилання запиту необхідно натиснути кнопку `Send Request`, яка відображається над кожним HTTP-запитом.

Приклад запиту для створення нового товару:

```http
POST http://localhost:3000/clothes
Content-Type: application/json

{
  "title": "Oversize Hoodie",
  "price": 1200,
  "size": "M",
  "material": "Cotton",
  "color": "Black"
}
```

Приклад отримання всіх товарів:

```http
GET http://localhost:3000/clothes
```

Приклад отримання товару за ID:

```http
GET http://localhost:3000/clothes/ID_ТОВАРУ
```

Приклад оновлення товару:

```http
PATCH http://localhost:3000/clothes/ID_ТОВАРУ
Content-Type: application/json

{
  "price": 1350,
  "color": "Dark Blue"
}
```

Приклад видалення товару:

```http
DELETE http://localhost:3000/clothes/ID_ТОВАРУ
```

---

# 6. Висновок

Під час виконання практичної роботи № 5 було створено та реорганізовано REST API-застосунок на основі NestJS для управління каталогом одягу та взуття відповідно до Варіанта 3.

На першому рівні було створено NestJS-проєкт, контролер предметної області та DTO-класи для опису структури товарів.

На другому рівні реалізовано повний CRUD-функціонал із використанням In-Memory Service, механізму Dependency Injection, обробки виключень та правильних HTTP-статусів.

Під час модульної реорганізації застосунок було розділено на `SharedModule`, `ClothesModule` та `OrdersModule`. Також було реалізовано кастомні провайдери `APP_CONFIG` через `useValue` та `NOTIFICATION_CLIENT` через `useFactory`.

У результаті роботи отримано модульний REST API-застосунок із розділенням відповідальності між компонентами, повторним використанням сервісів та можливістю подальшого розширення функціональності.

**Мету практичної роботи досягнуто.**
