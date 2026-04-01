import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';

export interface TaskStats {
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  totalEstimate: number;
  pendingEstimate: number;
  inProgressEstimate: number;
  totalTasks: number;
}

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async findAll(query: TaskQueryDto): Promise<PaginatedTasks> {
    const {
      status,
      priority,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const validSortFields = ['createdAt', 'updatedAt', 'title', 'priority', 'status', 'estimate'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.subtasks', 'subtask')
      .where('task.parent_id IS NULL');

    if (status) {
      qb.andWhere('task.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('task.priority = :priority', { priority });
    }

    if (search) {
      qb.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy(`task.${safeSortBy}`, safeSortOrder);

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['subtasks', 'parent'],
    });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    // Cargar subtareas anidadas
    task.subtasks = await this.loadSubtaskTree(task.subtasks);

    return task;
  }

  private async loadSubtaskTree(subtasks: Task[]): Promise<Task[]> {
    if (!subtasks || subtasks.length === 0) return [];

    const loaded: Task[] = [];
    for (const sub of subtasks) {
      const full = await this.taskRepository.findOne({
        where: { id: sub.id },
        relations: ['subtasks'],
      });
      if (full) {
        full.subtasks = await this.loadSubtaskTree(full.subtasks);
        loaded.push(full);
      }
    }
    return loaded;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    if (dto.parentId) {
      const parent = await this.taskRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent task with id "${dto.parentId}" not found`,
        );
      }
      // Previene referencias circulares
      await this.ensureNoCircularReference(dto.parentId, null);
    }

    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description ?? undefined,
      status: dto.status,
      priority: dto.priority,
      estimate: dto.estimate !== undefined ? dto.estimate : undefined,
      parentId: dto.parentId ?? undefined,
    });

    return this.taskRepository.save(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.parentId !== undefined) {
      if (dto.parentId !== null) {
        if (dto.parentId === id) {
          throw new BadRequestException('A task cannot be its own parent');
        }
        const parent = await this.taskRepository.findOne({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new NotFoundException(
            `Parent task with id "${dto.parentId}" not found`,
          );
        }
        await this.ensureNoCircularReference(dto.parentId, id);
      }
    }

    const updateData: Partial<Task> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if ('estimate' in dto) updateData.estimate = dto.estimate;
    if ('parentId' in dto) updateData.parentId = dto.parentId;

    await this.taskRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  async getStats(): Promise<TaskStats> {
    const allTasks = await this.taskRepository.find();

    const todoCount = allTasks.filter((t) => t.status === TaskStatus.TODO).length;
    const inProgressCount = allTasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const doneCount = allTasks.filter((t) => t.status === TaskStatus.DONE).length;

    const totalEstimate = allTasks.reduce(
      (sum, t) => sum + (Number(t.estimate) || 0),
      0,
    );

    const pendingEstimate = allTasks
      .filter((t) => t.status === TaskStatus.TODO)
      .reduce((sum, t) => sum + (Number(t.estimate) || 0), 0);

    const inProgressEstimate = allTasks
      .filter((t) => t.status === TaskStatus.IN_PROGRESS)
      .reduce((sum, t) => sum + (Number(t.estimate) || 0), 0);

    return {
      todoCount,
      inProgressCount,
      doneCount,
      totalEstimate,
      pendingEstimate,
      inProgressEstimate,
      totalTasks: allTasks.length,
    };
  }

  /**
   * Evita ciclos al asignar un padre a la tarea.
  */
  
  private async ensureNoCircularReference(
    proposedParentId: string,
    taskId: string | null,
  ): Promise<void> {
    if (!taskId) return;

    let current = await this.taskRepository.findOne({
      where: { id: proposedParentId },
    });

    const visited = new Set<string>();

    while (current) {
      if (current.id === taskId) {
        throw new BadRequestException(
          'Setting this parent would create a circular reference',
        );
      }
      if (visited.has(current.id)) break;
      visited.add(current.id);

      if (!current.parentId) break;
      current = await this.taskRepository.findOne({
        where: { id: current.parentId },
      });
    }
  }

  /**
   * Suma los estimados de la tarea y sus subtareas.
   */
  computeTreeEstimate(task: Task): number {
    const self = Number(task.estimate) || 0;
    if (!task.subtasks || task.subtasks.length === 0) return self;
    const subtotalEstimate = task.subtasks.reduce(
      (sum, sub) => sum + this.computeTreeEstimate(sub),
      0,
    );
    return self + subtotalEstimate;
  }

  /**
   * Cuenta tareas por estado.
   */
  countByStatus(
    task: Task,
  ): { todo: number; inProgress: number; done: number } {
    const counts = { todo: 0, inProgress: 0, done: 0 };

    const walk = (t: Task) => {
      if (t.status === TaskStatus.TODO) counts.todo++;
      else if (t.status === TaskStatus.IN_PROGRESS) counts.inProgress++;
      else if (t.status === TaskStatus.DONE) counts.done++;

      if (t.subtasks) t.subtasks.forEach(walk);
    };

    walk(task);
    return counts;
  }
}