import { IsOptional, IsString } from 'class-validator';

export class UpdateCalculoDto {
  @IsOptional()
  @IsString()
  nombreMuestra?: string;
}
