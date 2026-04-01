import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksService } from './task.service';
import { Task } from './entities/task.entity';
import { TaskStatus } from './entities/task.entity';
import { TaskPriority } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T extends ObjectLiteral = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'uuid-1',
  title: 'Test task',
  description: 'A description',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  estimate: null,
  parentId: null,
  parent: null as any, //* cambiar entity
  subtasks: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('TasksService', () => {
  let service: TasksService;
  let repo: MockRepository<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repo = module.get<MockRepository<Task>>(getRepositoryToken(Task));
  });

  afterEach(() => jest.clearAllMocks());

  // ── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the task when found', async () => {
      const task = makeTask({ subtasks: [] });
      repo.findOne!.mockResolvedValue(task);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(task);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        relations: ['subtasks', 'parent'],
      });
    });

    it('throws NotFoundException when task does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a task with valid data', async () => {
      const dto: CreateTaskDto = {
        title: 'New task',
        description: 'Desc',
        priority: TaskPriority.HIGH,
      };
      const created = makeTask({ title: 'New task', priority: TaskPriority.HIGH });
      repo.create!.mockReturnValue(created);
      repo.save!.mockResolvedValue(created);

      const result = await service.create(dto);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result.title).toBe('New task');
    });

    it('creates a subtask when parentId is valid', async () => {
      const parent = makeTask({ id: 'parent-uuid' });
      repo.findOne!.mockResolvedValueOnce(parent); // for parent lookup
      const dto: CreateTaskDto = { title: 'Subtask', parentId: 'parent-uuid' };
      const created = makeTask({ title: 'Subtask', parentId: 'parent-uuid' });
      repo.create!.mockReturnValue(created);
      repo.save!.mockResolvedValue(created);

      const result = await service.create(dto);
      expect(result.parentId).toBe('parent-uuid');
    });

    it('throws NotFoundException when parentId does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);
      const dto: CreateTaskDto = { title: 'Orphan', parentId: 'bad-uuid' };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates allowed fields', async () => {
      const existing = makeTask();
      const updated = makeTask({ title: 'Updated', status: TaskStatus.IN_PROGRESS });

      // findOne is called twice: once for existence check, once to return result
      repo.findOne!
        .mockResolvedValueOnce(existing) // initial findOne in update()
        .mockResolvedValueOnce(updated)  // second findOne call inside findOne()
        .mockResolvedValueOnce(updated); // third call for final return

      repo.update!.mockResolvedValue({ affected: 1 });

      const dto: UpdateTaskDto = { title: 'Updated', status: TaskStatus.IN_PROGRESS };
      const result = await service.update('uuid-1', dto);
      expect(repo.update).toHaveBeenCalledWith('uuid-1', expect.objectContaining({
        title: 'Updated',
        status: TaskStatus.IN_PROGRESS,
      }));
    });

    it('throws BadRequestException when setting self as parent', async () => {
      const existing = makeTask({ id: 'uuid-1' });
      repo.findOne!.mockResolvedValue(existing);

      const dto: UpdateTaskDto = { parentId: 'uuid-1' };
      await expect(service.update('uuid-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when task does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.update('ghost', { title: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('removes the task', async () => {
      const task = makeTask({ subtasks: [] });
      repo.findOne!.mockResolvedValue(task);
      repo.remove!.mockResolvedValue(task);

      await service.remove('uuid-1');
      expect(repo.remove).toHaveBeenCalledWith(task);
    });

    it('throws NotFoundException when task does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns correct counts and estimates', async () => {
      const tasks = [
        makeTask({ status: TaskStatus.TODO, estimate: 3 }),
        makeTask({ id: 'uuid-2', status: TaskStatus.TODO, estimate: 2 }),
        makeTask({ id: 'uuid-3', status: TaskStatus.IN_PROGRESS, estimate: 5 }),
        makeTask({ id: 'uuid-4', status: TaskStatus.DONE, estimate: null }),
      ];
      repo.find!.mockResolvedValue(tasks);

      const stats = await service.getStats();

      expect(stats.todoCount).toBe(2);
      expect(stats.inProgressCount).toBe(1);
      expect(stats.doneCount).toBe(1);
      expect(stats.totalTasks).toBe(4);
      expect(stats.totalEstimate).toBe(10);
      expect(stats.pendingEstimate).toBe(5);
      expect(stats.inProgressEstimate).toBe(5);
    });

    it('returns zeros when no tasks exist', async () => {
      repo.find!.mockResolvedValue([]);

      const stats = await service.getStats();
      expect(stats.todoCount).toBe(0);
      expect(stats.totalEstimate).toBe(0);
    });
  });

  // ── computeTreeEstimate ──────────────────────────────────────────────────

  describe('computeTreeEstimate', () => {
    it('returns own estimate when no subtasks', () => {
      const task = makeTask({ estimate: 4, subtasks: [] });
      expect(service.computeTreeEstimate(task)).toBe(4);
    });

    it('sums nested subtask estimates recursively', () => {
      const leaf1 = makeTask({ id: 'l1', estimate: 2, subtasks: [] });
      const leaf2 = makeTask({ id: 'l2', estimate: 3, subtasks: [] });
      const child = makeTask({ id: 'c1', estimate: 1, subtasks: [leaf1, leaf2] });
      const root = makeTask({ id: 'r1', estimate: 5, subtasks: [child] });

      expect(service.computeTreeEstimate(root)).toBe(11); // 5 + 1 + 2 + 3
    });

    it('treats null estimate as 0', () => {
      const child = makeTask({ id: 'c1', estimate: null, subtasks: [] });
      const root = makeTask({ id: 'r1', estimate: null, subtasks: [child] });
      expect(service.computeTreeEstimate(root)).toBe(0);
    });

    it('handles deeply nested trees', () => {
      const level3 = makeTask({ id: 'l3', estimate: 1, subtasks: [] });
      const level2 = makeTask({ id: 'l2', estimate: 2, subtasks: [level3] });
      const level1 = makeTask({ id: 'l1', estimate: 3, subtasks: [level2] });
      const root = makeTask({ id: 'r', estimate: 4, subtasks: [level1] });

      expect(service.computeTreeEstimate(root)).toBe(10);
    });
  });

  // ── countByStatus ────────────────────────────────────────────────────────

  describe('countByStatus', () => {
    it('counts statuses in a flat task', () => {
      const task = makeTask({ status: TaskStatus.IN_PROGRESS, subtasks: [] });
      const counts = service.countByStatus(task);
      expect(counts.inProgress).toBe(1);
      expect(counts.todo).toBe(0);
      expect(counts.done).toBe(0);
    });

    it('counts statuses recursively across nested subtasks', () => {
      const sub1 = makeTask({ id: 's1', status: TaskStatus.DONE, subtasks: [] });
      const sub2 = makeTask({ id: 's2', status: TaskStatus.TODO, subtasks: [] });
      const sub3 = makeTask({ id: 's3', status: TaskStatus.IN_PROGRESS, subtasks: [] });
      const root = makeTask({
        id: 'r',
        status: TaskStatus.TODO,
        subtasks: [sub1, sub2, sub3],
      });

      const counts = service.countByStatus(root);
      expect(counts.todo).toBe(2);
      expect(counts.inProgress).toBe(1);
      expect(counts.done).toBe(1);
    });

    it('handles tasks with no subtasks field', () => {
      const task = makeTask({ subtasks: undefined });
      const counts = service.countByStatus(task);
      expect(counts.todo).toBe(1);
    });
  });

  // ── ensureNoCircularReference (indirectly via create/update) ─────────────

  describe('circular reference prevention', () => {
    it('prevents creating a task that references a descendant as parent', async () => {
      // Task A exists. We try to update A to have parent B,
      // but B already has A as an ancestor.
      const taskA = makeTask({ id: 'A', parentId: null });
      const taskB = makeTask({ id: 'B', parentId: 'A' }); // B is child of A

      // findOne calls: first for existence of taskA (in update), then for parent B, then traversal
      repo.findOne!
        .mockResolvedValueOnce(taskA)   // update() finds task A
        .mockResolvedValueOnce(taskA)   // loadSubtreeTree call (ignored in update path)
        .mockResolvedValueOnce(taskB)   // proposed parent lookup
        .mockResolvedValueOnce(taskA);  // walking up from B -> A (which equals taskId 'A')

      repo.update!.mockResolvedValue({ affected: 1 });

      await expect(service.update('A', { parentId: 'B' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});