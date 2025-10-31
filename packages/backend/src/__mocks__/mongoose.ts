// Mongoose mock - automatically used by Jest
// Based on our current mongoose usage patterns

const mockDocument = {
  _id: 'mock-id',
  save: jest.fn().mockResolvedValue({}),
  toObject: jest.fn().mockReturnValue({}),
  toJSON: jest.fn().mockReturnValue({}),
  deleteOne: jest.fn().mockResolvedValue({}),
};

const mockQuery = {
  exec: jest.fn(),
  lean: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
};

const mockModel = jest.fn().mockImplementation(() => mockDocument);
Object.assign(mockModel, {
  find: jest.fn(() => mockQuery),
  findById: jest.fn(() => mockQuery),
  findOne: jest.fn(() => mockQuery),
  create: jest.fn().mockResolvedValue(mockDocument),
  findByIdAndUpdate: jest.fn(() => mockQuery),
  findByIdAndDelete: jest.fn(() => mockQuery),
  countDocuments: jest.fn(() => mockQuery),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
});

const mockSchema = jest.fn().mockImplementation(() => ({
  pre: jest.fn(),
  set: jest.fn(),
  virtual: jest.fn(() => ({ get: jest.fn() })),
  statics: {},
  methods: {},
  index: jest.fn(),
}));

const mockConnection = {
  readyState: 1,
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
  db: {
    admin: () => ({ ping: jest.fn().mockResolvedValue({ ok: 1 }) }),
    dropDatabase: jest.fn().mockResolvedValue({}),
  },
  collections: {},
};

export const Schema = mockSchema;
export const model = jest.fn(() => mockModel);
export const connect = jest.fn().mockResolvedValue({});
export const disconnect = jest.fn().mockResolvedValue({});
export const connection = mockConnection;

// Default export for mongoose
const mongoose = {
  connect,
  disconnect,
  connection: mockConnection,
  model,
  Schema: mockSchema,
};

export default mongoose;
