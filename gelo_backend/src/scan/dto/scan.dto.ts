import { IsArray, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteScanDto {
  @ApiProperty({
    example: [
      { questionId: 1, answer: 'yes' },
      { questionId: 2, answer: 'no' }
    ],
    description: 'Array of diagnostic answers'
  })
  @IsArray()
  @IsNotEmpty()
  answers: any[];
}
