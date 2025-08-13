// src/servers/dto/create-server.dto.ts
import { IsIP, IsOptional, IsString } from 'class-validator';

export class CreateServerDto {
  @IsString() hostname: string;
  @IsIP() ipAddress: string;
  @IsString() os: string;
  @IsString() status: string;
  @IsString() environment: string;
  @IsString() role: string;
  @IsString() location: string;
  @IsOptional() @IsString() folder?: string;
}
