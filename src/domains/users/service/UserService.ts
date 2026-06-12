import bcryptjs from 'bcryptjs';
import { UserRepository } from '../repository/UserRepository';
import { CreateUserDto } from '../dto/CreateUserDto';
import { UserResponseDto } from '../dto/UserResponseDto';
import { ValidationException } from '../../../common/exceptions/ValidationException';
import { Validators } from '../../../common/utils/validators';

export class UserService {
  private userRepository = new UserRepository();

  async register(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Validate email and password
    Validators.validateEmail(createUserDto.email);
    Validators.validatePassword(createUserDto.password);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ValidationException('User already exists', {
        email: ['Email already in use'],
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(createUserDto.password, 10);

    // Create user
    const user = await this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
    });

    return UserResponseDto.fromEntity(user);
  }

  async login(loginDto: CreateUserDto): Promise<UserResponseDto> {
    Validators.validateEmail(loginDto.email);
    Validators.validatePassword(loginDto.password);

    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new ValidationException('Invalid email or password', {
        email: ['User not found'],
      });
    }

    const isPasswordValid = await bcryptjs.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new ValidationException('Invalid email or password', {
        password: ['Incorrect password'],
      });
    }

    return UserResponseDto.fromEntity(user);
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    return UserResponseDto.fromEntity(user);
  }

  async getUserByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => UserResponseDto.fromEntity(user));
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
