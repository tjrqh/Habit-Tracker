export class UpdateSessionDto {
  status?: string;
  endTime?: Date;

  constructor(status?: string, endTime?: Date) {
    this.status = status;
    this.endTime = endTime;
  }
}
