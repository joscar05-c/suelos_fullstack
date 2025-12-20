import { PartialType } from '@nestjs/mapped-types';
import { CreateChacraDto } from './create-chacra.dto';

export class UpdateChacraDto extends PartialType(CreateChacraDto) {}
