import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@mail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['admin', 'doctor', 'patient'], example: 'doctor' })
  @IsEnum(['admin', 'doctor', 'patient'])
  role: 'admin' | 'doctor' | 'patient';

  // Campos específicos de Doctor
  @ApiPropertyOptional({ example: 'Medicina General' })
  @IsOptional()
  @IsString()
  specialty?: string;

  // Campos específicos de Patient
  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
