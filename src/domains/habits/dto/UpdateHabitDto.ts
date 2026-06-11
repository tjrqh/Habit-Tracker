export class UpdateHabitDto {
  title?: string;
  targetTomato?: number;
  description?: string;
  isActive?: boolean;

  constructor(
    title?: string,
    targetTomato?: number,
    description?: string,
    isActive?: boolean,
  ) {
    this.title = title;
    this.targetTomato = targetTomato;
    this.description = description;
    this.isActive = isActive;
  }
}
