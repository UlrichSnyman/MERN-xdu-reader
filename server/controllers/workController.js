const Work = require('../models/Work');
const Page = require('../models/Page');
const { mockWorks } = require('../mockData');

// Check if database is available
const isDemoMode = process.env.DEMO_MODE === 'true';

// Get all works (public)
const getAllWorks = async (req, res) => {
  try {
    if (isDemoMode) {
      // Return mock data
      res.json(mockWorks);
      return;
    }
    
    const works = await Work.find()
      .select('title synopsis coverImage category likes createdAt')
      .sort({ createdAt: -1 });
    
    res.json(works);
  } catch (error) {
    console.error('Error fetching works:', error);
    // Fallback to mock data on error
    res.json(mockWorks);
  }
};

// Get single work with pages (public)
const getWorkById = async (req, res) => {
  try {
    if (isDemoMode) {
      // Return mock data
      const work = mockWorks.find(w => w._id === req.params.id);
      if (!work) {
        return res.status(404).json({ error: 'Work not found' });
      }
      res.json(work);
      return;
    }
    
    const work = await Work.findById(req.params.id)
      .populate({
        path: 'pages',
        select: 'title pageNumber createdAt',
        options: { sort: { pageNumber: 1 } }
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
    
    // Delete all pages associated with this work
    await Page.deleteMany({ work: work._id });
    
    // Delete the work
    await Work.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Work and associated pages deleted successfully' });
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