
# Development Test Scripts

This directory contains test scripts for the Fast Journaling System.

## Quick Start

1. **Make sure the server is running:**
   ```bash
   npm run dev
   ```

2. **Run the simple test:**
   ```bash
   cd dev-scripts
   node simple-test.js
   ```

3. **Run the comprehensive test:**
   ```bash
   node test-fast-journaling.js
   ```

## Test Scripts

### `simple-test.js`
- Tests the therapeutic chat API endpoints directly
- Simulates user input and checks responses
- Tests both regular chat and action buttons
- Minimal dependencies, runs immediately

### `test-fast-journaling.js`
- Comprehensive test of the entire system
- Tests FastChatEngine directly
- Triggers post-processing jobs
- Checks psychological profile creation
- Requires proper database setup

### `mock-data.json`
- Contains test data for various scenarios
- Journal entries with expected emotional themes
- Test user profiles

## Expected Output

The tests will show:
- ✅ Successful API responses
- 📄 AI-generated analysis and questions
- 🧠 Psychological insights
- 📊 Post-processing job status

## Troubleshooting

**Server not responding:**
- Make sure the server is running on port 5000
- Check for any TypeScript compilation errors

**Import errors:**
- Some tests require the server modules to be properly built
- Run `npm run dev` first to ensure all modules are available

**Database errors:**
- Ensure the database is connected and tables exist
- Check the `.env` file for correct database configuration
