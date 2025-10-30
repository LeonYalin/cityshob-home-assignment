/**
 * Test doubles for internal dependencies
 * These provide better testing than mocks for most scenarios
 * They maintain state and provide rich testing utilities
 */

import { FakeLogger } from './fake-logger';
import { FakeTodoRepository } from './fake-todo-repository';

export { FakeLogger } from './fake-logger';
export { FakeTodoRepository } from './fake-todo-repository';

// Factory functions for convenience
export const createFakeLogger = (context?: string) => new FakeLogger(context);
export const createFakeTodoRepository = () => new FakeTodoRepository();

// Pre-configured test doubles
export const createTestDoubles = () => ({
  logger: createFakeLogger('test'),
  todoRepository: createFakeTodoRepository(),
});