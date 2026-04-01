import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";
import { TaskPriority, TaskStatus } from "../entities/task.entity";
import { Type } from "class-transformer";

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
 
  @IsOptional()
  @IsString()
  description?: string;
 
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
 
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
 
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimate?: number;
 
  @IsOptional()
  @IsUUID()
  parentId?: string;
}