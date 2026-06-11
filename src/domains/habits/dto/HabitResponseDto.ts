export class HabitResponseDto {
  id!: string;
  userId!: string;
  title!: string;
  targetTomato!: number;
  description?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(
    id: string,
    userId: string,
    title: string,
    targetTomato: number,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    description?: string,
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.targetTomato = targetTomato;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.description = description;
  }

  static fromEntity(entity: any): HabitResponseDto {
    return new HabitResponseDto(
      entity.id,
      entity.userId,
      entity.title,
      entity.targetTomato,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      entity.description,
    );
  }
}
