import Question from '../models/Question.js';

// GET /api/questions/course/:courseId
export const getQuestionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) return res.status(400).json({ message: 'Missing courseId' });
    // Sort by createdAt if available, otherwise by _id descending
    const questions = await Question.find({ course: courseId }).sort({ createdAt: -1, _id: -1 });
    res.json({ questions });
  } catch (err) {
    console.error('getQuestionsByCourse error', err);
    res.status(500).json({ message: 'Failed to fetch questions', error: err.message });
  }
};

export const getRecentQuestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    // Return most recent questions irrespective of course (for admins/teachers to import)
    const questions = await Question.find({}).sort({ createdAt: -1, _id: -1 }).limit(limit);
    res.json({ questions });
  } catch (err) {
    console.error('getRecentQuestions error', err);
    res.status(500).json({ message: 'Failed to fetch recent questions', error: err.message });
  }
};

  export const publishQuestion = async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: 'Missing question id' });
      const q = await Question.findById(id);
      if (!q) return res.status(404).json({ message: 'Question not found' });
      q.published = true;
      await q.save();
      res.json({ message: 'Question published', question: q });
    } catch (err) {
      console.error('publishQuestion error', err);
      res.status(500).json({ message: 'Failed to publish question', error: err.message });
    }
  };

  export const deleteQuestion = async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: 'Missing question id' });
      const q = await Question.findById(id);
      if (!q) return res.status(404).json({ message: 'Question not found' });
      await Question.findByIdAndDelete(id);
      res.json({ message: 'Question deleted' });
    } catch (err) {
      console.error('deleteQuestion error', err);
      res.status(500).json({ message: 'Failed to delete question', error: err.message });
    }
  };

export default { getQuestionsByCourse };
