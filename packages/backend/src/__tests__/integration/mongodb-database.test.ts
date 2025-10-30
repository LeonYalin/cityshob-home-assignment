describe('MongoDB Integration Test', () => {
  it('should have access to MongoDB globals', () => {
    console.log('Available globals:', Object.keys(global));
    console.log('__MONGO_URI__:', (global as any).__MONGO_URI__);
    console.log('__MONGO_DB_NAME__:', (global as any).__MONGO_DB_NAME__);
    
    // Just pass for now to see what @shelf/jest-mongodb provides
    expect(true).toBe(true);
  });
});
