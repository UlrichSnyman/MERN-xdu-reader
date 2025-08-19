const Chapter = require('../models/Chapter');
const Work = require('../models/Work');

// Get chapter by ID (public)
const getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('work', 'title');
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Get previous and next chapter info
    const previousChapter = await Chapter.findOne({
      work: chapter.work._id,
      chapterNumber: chapter.chapterNumber - 1
    }).select('_id title chapterNumber');
    
    const nextChapter = await Chapter.findOne({
      work: chapter.work._id,
      chapterNumber: chapter.chapterNumber + 1
    }).select('_id title chapterNumber');
    
    res.json({
      ...chapter.toObject(),
      navigation: {
        previous: previousChapter,
        next: nextChapter
      }
    });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Server error while fetching chapter' });
  }
};

// Create new chapter (admin only)
const createChapter = async (req, res) => {
  try {
    const { title, content, workId, chapterNumber } = req.body;
    
    if (!title || !content || !workId || !chapterNumber) {
      return res.status(400).json({ error: 'Title, content, workId, and chapterNumber are required' });
    }
    
    // Verify work exists
    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    const chapter = new Chapter({
      title,
      content,
      work: workId,
      chapterNumber
    });
    
    await chapter.save();
    
    // Add chapter to work's chapters array
    await Work.findByIdAndUpdate(workId, {
      $push: { chapters: chapter._id }
    });
    
    res.status(201).json(chapter);
  } catch (error) {
    console.error('Error creating chapter:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Chapter number already exists for this work' });
    }
    res.status(500).json({ error: 'Server error while creating chapter' });
  }
};

// Update chapter (admin only)
const updateChapter = async (req, res) => {
  try {
    const { title, content, chapterNumber } = req.body;
    
    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { title, content, chapterNumber },
      { new: true, runValidators: true }
    );
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    res.json(chapter);
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ error: 'Server error while updating chapter' });
  }
};

// Delete chapter (admin only)
const deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Remove chapter from work's chapters array
    await Work.findByIdAndUpdate(chapter.work, {
      $pull: { chapters: chapter._id }
    });
    
    // Delete the chapter
    await Chapter.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ error: 'Server error while deleting chapter' });
  }
};

// Like a chapter (public)
const likeChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    res.json({ likes: chapter.likes });
  } catch (error) {
    console.error('Error liking chapter:', error);
    res.status(500).json({ error: 'Server error while liking chapter' });
  }
};

module.exports = {
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  likeChapter
};