const Page = require('../models/Page');
const Work = require('../models/Work');
const { mockPages } = require('../mockData');

// Check if database is available
const isDemoMode = process.env.DEMO_MODE === 'true';

// Get page by ID (public)
const getPageById = async (req, res) => {
  try {
    if (isDemoMode) {
      // Return mock data
      const page = mockPages.find(p => p._id === req.params.id);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
      return;
    }
    
    const page = await Page.findById(req.params.id)
      .populate('work', 'title');
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    // Get previous and next page info
    const previousPage = await Page.findOne({
      work: page.work._id,
      pageNumber: page.pageNumber - 1
    }).select('_id title pageNumber');
    
    const nextPage = await Page.findOne({
      work: page.work._id,
      pageNumber: page.pageNumber + 1
    }).select('_id title pageNumber');
    
    res.json({
      ...page.toObject(),
      navigation: {
        previous: previousPage,
        next: nextPage
      }
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Server error while fetching page' });
  }
};

// Create new page (admin only)
const createPage = async (req, res) => {
  try {
    const { title, content, workId, pageNumber } = req.body;
    
    if (!title || !content || !workId || !pageNumber) {
      return res.status(400).json({ error: 'Title, content, workId, and pageNumber are required' });
    }
    
    // Verify work exists
    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    const page = new Page({
      title,
      content,
      work: workId,
      pageNumber
    });
    
    await page.save();
    
    // Add page to work's pages array
    await Work.findByIdAndUpdate(workId, {
      $push: { pages: page._id }
    });
    
    res.status(201).json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Page number already exists for this work' });
    }
    res.status(500).json({ error: 'Server error while creating page' });
  }
};

// Update page (admin only)
const updatePage = async (req, res) => {
  try {
    const { title, content, pageNumber } = req.body;
    
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { title, content, pageNumber },
      { new: true, runValidators: true }
    );
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Server error while updating page' });
  }
};

// Delete page (admin only)
const deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    // Remove page from work's pages array
    await Work.findByIdAndUpdate(page.work, {
      $pull: { pages: page._id }
    });
    
    // Delete the page
    await Page.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Server error while deleting page' });
  }
};

// Like a page (public)
const likePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json({ likes: page.likes });
  } catch (error) {
    console.error('Error liking page:', error);
    res.status(500).json({ error: 'Server error while liking page' });
  }
};

module.exports = {
  getPageById,
  createPage,
  updatePage,
  deletePage,
  likePage
};