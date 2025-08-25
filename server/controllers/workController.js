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
    
    // Include likedBy so we can compute hasLiked for authenticated users, and populate usernames for admins
    const works = await Work.find()
      .select('title synopsis coverImage category likes createdAt likedBy')
      .sort({ createdAt: -1 })
      .populate('likedBy', 'username')
      .lean();
    
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    const result = works.map(w => {
      const likedByArray = Array.isArray(w.likedBy) ? w.likedBy : [];
      const hasLiked = userId
        ? likedByArray.some(u => (u._id ? u._id.toString() : u.toString()) === userId)
        : false;
      const likedByUsers = isAdmin
        ? likedByArray
            .filter(u => typeof u === 'object' && u !== null)
            .map(u => ({ _id: u._id.toString(), username: u.username }))
        : undefined;

      return {
        ...w,
        hasLiked,
        likedBy: undefined, // hide raw ids
        ...(isAdmin && { likedByUsers })
      };
    });

    res.json(result);
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
      })
      .populate('likedBy', 'username');
    
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    // Add user-specific data if authenticated
    let workData = work.toObject();
    if (req.user) {
      workData.hasLiked = work.likedBy.some(u => u._id.toString() === req.user.id);
      if (req.user.role === 'admin') {
        workData.likedByUsers = work.likedBy.map(u => ({ _id: u._id.toString(), username: u.username }));
      }
      
      // Find user's reading progress
      const progress = work.readingProgress.find(p => p.user.toString() === req.user.id);
      if (progress) {
        workData.userProgress = {
          currentPage: progress.currentPage,
          pagesRead: progress.pagesRead.length,
          totalPages: work.pages.length,
          lastReadAt: progress.lastReadAt
        };
      }
    }
    
    // Always hide raw likedBy
    delete workData.likedBy;

    res.json(workData);
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
    const userId = req.user ? req.user.id : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to like works' });
    }
    
    const work = await Work.findById(req.params.id);
    
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    // Check if user has already liked this work
    const hasLiked = work.likedBy.includes(userId);
    
    if (hasLiked) {
      return res.status(400).json({ error: 'You have already liked this work' });
    }
    
    // Add user to likedBy array and increment likes
    work.likedBy.push(userId);
    work.likes += 1;
    await work.save();
    
    res.json({ likes: work.likes, hasLiked: true });
  } catch (error) {
    console.error('Error liking work:', error);
    res.status(500).json({ error: 'Server error while liking work' });
  }
};

// Unlike a work (user only)
const unlikeWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }

    if (!work.likedBy.includes(req.user.id)) {
      return res.status(400).json({ error: 'You have not liked this work' });
    }

    work.likedBy = work.likedBy.filter(userId => userId.toString() !== req.user.id);
    work.likes = work.likedBy.length;
    
    await work.save();
    
    res.json({ 
      likes: work.likes,
      hasLiked: false
    });
  } catch (error) {
    console.error('Error unliking work:', error);
    res.status(500).json({ error: 'Server error while unliking work' });
  }
};

// Update reading progress (user)
const updateReadingProgress = async (req, res) => {
  try {
    const { workId, pageId } = req.body;

    // In demo mode or when DB is not available, return a mock success response
    if (isDemoMode) {
      return res.json({
        currentPage: pageId,
        pagesRead: 0,
        totalPages: 0
      });
    }

    const userId = req.user.id;
    
    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }

    if (!Array.isArray(work.readingProgress)) {
      work.readingProgress = [];
    }
    
    // Find or create user's reading progress
    let progress = work.readingProgress.find(p => p.user.toString() === userId);
    
    if (!progress) {
      progress = {
        user: userId,
        currentPage: pageId,
        pagesRead: [pageId],
        lastReadAt: new Date()
      };
      work.readingProgress.push(progress);
    } else {
      progress.currentPage = pageId;
      progress.lastReadAt = new Date();
      if (!Array.isArray(progress.pagesRead)) progress.pagesRead = [];
      
      // Add page to pagesRead if not already there (handle ObjectId/string)
      if (!progress.pagesRead.some(p => p.toString() === pageId)) {
        progress.pagesRead.push(pageId);
      }
    }
    
    await work.save();
    
    res.json({
      currentPage: progress.currentPage,
      pagesRead: progress.pagesRead.length,
      totalPages: Array.isArray(work.pages) ? work.pages.length : 0
    });
  } catch (error) {
    console.error('Error updating reading progress:', error);
    res.status(500).json({ error: 'Server error while updating reading progress' });
  }
};

// Get reading progress stats for admin dashboard
const getReadingProgressStats = async (req, res) => {
  try {
    const works = await Work.find()
      .populate('readingProgress.user', 'username')
      .populate('readingProgress.currentPage', 'pageNumber title')
      .select('title readingProgress pages');
    
    const stats = works.map(work => ({
      workId: work._id,
      title: work.title,
      totalPages: work.pages.length,
      readers: work.readingProgress.map(progress => ({
        username: progress.user.username,
        currentPage: progress.currentPage ? progress.currentPage.pageNumber : 0,
        pagesRead: progress.pagesRead.length,
        lastReadAt: progress.lastReadAt,
        progressPercentage: Math.round((progress.pagesRead.length / work.pages.length) * 100)
      }))
    }));
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching reading progress stats:', error);
    res.status(500).json({ error: 'Server error while fetching reading progress stats' });
  }
};

module.exports = {
  getAllWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  likeWork,
  unlikeWork,
  updateReadingProgress,
  getReadingProgressStats
};