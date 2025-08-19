const Work = require('../models/Work');
const Chapter = require('../models/Chapter');

// Get all works (public)
const getAllWorks = async (req, res) => {
  try {
    const works = await Work.find()
      .select('title synopsis coverImage category likes createdAt')
      .sort({ createdAt: -1 });
    
    res.json(works);
  } catch (error) {
    console.error('Error fetching works:', error);
    res.status(500).json({ error: 'Server error while fetching works' });
  }
};

// Get single work with chapters (public)
const getWorkById = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id)
      .populate({
        path: 'chapters',
        select: 'title chapterNumber createdAt',
        options: { sort: { chapterNumber: 1 } }
      });
    
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    res.json(work);
  } catch (error) {
    console.error('Error fetching work:', error);
    res.status(500).json({ error: 'Server error while fetching work' });
  }
};

// Create new work (admin only)
const createWork = async (req, res) => {
  try {
    const { title, synopsis, coverImage, category } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const work = new Work({
      title,
      synopsis,
      coverImage,
      category
    });
    
    await work.save();
    res.status(201).json(work);
  } catch (error) {
    console.error('Error creating work:', error);
    res.status(500).json({ error: 'Server error while creating work' });
  }
};

// Update work (admin only)
const updateWork = async (req, res) => {
  try {
    const { title, synopsis, coverImage, category } = req.body;
    
    const work = await Work.findByIdAndUpdate(
      req.params.id,
      { title, synopsis, coverImage, category },
      { new: true, runValidators: true }
    );
    
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    res.json(work);
  } catch (error) {
    console.error('Error updating work:', error);
    res.status(500).json({ error: 'Server error while updating work' });
  }
};

// Delete work (admin only)
const deleteWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    // Delete all chapters associated with this work
    await Chapter.deleteMany({ work: work._id });
    
    // Delete the work
    await Work.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Work and associated chapters deleted successfully' });
  } catch (error) {
    console.error('Error deleting work:', error);
    res.status(500).json({ error: 'Server error while deleting work' });
  }
};

// Like a work (public)
const likeWork = async (req, res) => {
  try {
    const work = await Work.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    res.json({ likes: work.likes });
  } catch (error) {
    console.error('Error liking work:', error);
    res.status(500).json({ error: 'Server error while liking work' });
  }
};

module.exports = {
  getAllWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  likeWork
};