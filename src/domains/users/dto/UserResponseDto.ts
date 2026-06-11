export class UserResponseDto {
  id!: string;
  email!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(id: string, email: string, createdAt: Date, updatedAt: Date) {
    this.id = id;
    this.email = email;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromEntity(entity: any): UserResponseDto {
    return new UserResponseDto(entity.id, entity.email, entity.createdAt, entity.updatedAt);
  }
}
