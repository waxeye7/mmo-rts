const assert = require('assert');
const mongoose = require('mongoose');
const User = require('./models/user');
const addAction = require('./controllers/user/addAction');
const resetActions = require('./controllers/user/resetActions');

// Connect to the database
const url = 'mongodb://127.0.0.1:27017/mmo-rts-test';

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.once('open', async () => {
  console.log('Test database connected:', url);
  await runTests();
  mongoose.connection.close();
});

// Test suite
const runTests = async () => {
  await testDecrementActions();
  await testResetActions();
  console.log('All tests passed');
};

// Test: decrementActions
const testDecrementActions = async () => {
  const testUser = new User({ username: 'testUser', email: 'test@example.com', password: 'password', actions: 10 });
  await testUser.save();

  const updatedUser = await addAction(action, testUser._id);
  assert.strictEqual(updatedUser.actions, 9, 'User actions should decrease by 1');

  await User.deleteOne({ _id: testUser._id });
};

// Test: resetActions
const testResetActions = async () => {
  const testUser1 = new User({ username: 'testUser1', email: 'test1@example.com', password: 'password', actions: 5 });
  const testUser2 = new User({ username: 'testUser2', email: 'test2@example.com', password: 'password', actions: 7 });
  await testUser1.save();
  await testUser2.save();

  await resetActions();

  const resetUser1 = await User.findById(testUser1._id);
  const resetUser2 = await User.findById(testUser2._id);
  assert.strictEqual(resetUser1.actions, 10, 'User 1 actions should be reset to 10');
  assert.strictEqual(resetUser2.actions, 10, 'User 2 actions should be reset to 10');

  await User.deleteOne({ _id: testUser1._id });
  await User.deleteOne({ _id: testUser2._id });
};