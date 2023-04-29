const Board = require('../../models/board');

const saveBoardState = async (board) => {
  try {
    const boardModel = await Board.findOne();
    if (!boardModel) {
      throw new Error('Board not found');
    }
    
    boardModel.state = board;
    await boardModel.save();
  } catch (error) {
    console.error('Error saving board state:', error);
  }
};

module.exports = saveBoardState;