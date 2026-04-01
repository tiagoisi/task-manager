import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { TaskPriority, TaskStatus } from "../entities/task.entity";
import { Type } from "class-transformer";

export class TaskQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
 
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
 
  @IsOptional()
  @IsString()
  search?: string;
 
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;
 
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
 
  @IsOptional()
  @IsString()
  sortBy?: string;
 
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}