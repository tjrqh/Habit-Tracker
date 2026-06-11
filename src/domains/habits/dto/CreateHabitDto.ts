export class CreateHabitDto {
  userId!: string;
  title!: string;
  targetTomato!: number;
  description?: string;

  constructor(userId: string, title: string, targetTomato: number, description?: string) {
    this.userId = userId;
    this.title = title;
    this.targetTomato = targetTomato;
    this.description = description;
  }
}
