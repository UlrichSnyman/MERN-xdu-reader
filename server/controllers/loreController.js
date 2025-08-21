const Lore = require('../models/Lore');
const User = require('../models/User');

// Get all lore entries (public)
const getAllLore = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    
    const loreEntries = await Lore.find(filter)
      .populate({ path: 'likedBy', select: 'username' })
      .select('title category likes likedBy createdAt')
      .sort({ createdAt: -1 });

    let results = loreEntries.map(lore => {
      const loreObject = lore.toObject();
      loreObject.hasLiked = req.user ? lore.likedBy.some(user => user._id.equals(req.user.id)) : false;
      
      if (req.user?.role === 'admin') {
        loreObject.likedByUsers = loreObject.likedBy;
      }
      delete loreObject.likedBy;
      return loreObject;
    });
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching lore:', error);
    res.status(500).json({ error: 'Server error while fetching lore' });
  }
};

// Get lore by ID (public)
const getLoreById = async (req, res) => {
  try {
    const lore = await Lore.findById(req.params.id).populate({ 
      path: 'likedBy', 
      select: 'username' 
    });
    
    if (!lore) {
      return res.status(404).json({ error: 'Lore entry not found' });
    }
    
    let loreData = lore.toObject();
    loreData.hasLiked = req.user ? lore.likedBy.some(user => user._id.equals(req.user.id)) : false;

    if (req.user?.role === 'admin') {
      loreData.likedByUsers = loreData.likedBy;
    }
    delete loreData.likedBy;
    
    res.json(loreData);
  } catch (error) {
    console.error('Error fetching lore:', error);
    res.status(500).json({ error: 'Server error while fetching lore' });
  }
};

// Create new lore entry (admin only)
const createLore = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }
    
    const lore = new Lore({
      title,
      content,
      category
    });
    
    await lore.save();
    res.status(201).json(lore);
  } catch (error) {
    console.error('Error creating lore:', error);
    res.status(500).json({ error: 'Server error while creating lore' });
  }
};

// Update lore entry (admin only)
const updateLore = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    const lore = await Lore.findByIdAndUpdate(
      req.params.id,
      { title, content, category },
      { new: true, runValidators: true }
    );
    
    if (!lore) {
      return res.status(404).json({ error: 'Lore entry not found' });
    }
    
    res.json(lore);
  } catch (error) {
    console.error('Error updating lore:', error);
    res.status(500).json({ error: 'Server error while updating lore' });
  }
};

// Delete lore entry (admin only)
const deleteLore = async (req, res) => {
  try {
    const lore = await Lore.findByIdAndDelete(req.params.id);
    
    if (!lore) {
      return res.status(404).json({ error: 'Lore entry not found' });
    }
    
    res.json({ message: 'Lore entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting lore:', error);
    res.status(500).json({ error: 'Server error while deleting lore' });
  }
};

// Like a lore entry (user only)
const likeLore = async (req, res) => {
  try {
    const lore = await Lore.findById(req.params.id);
    if (!lore) {
      return res.status(404).json({ error: 'Lore entry not found' });
    }

    const userId = req.user.id;
    if (lore.likedBy.includes(userId)) {
      return res.status(400).json({ error: 'You have already liked this lore entry' });
    }

    lore.likedBy.push(userId);
    lore.likes = lore.likedBy.length;
    await lore.save();

    // Update user document
    await User.findByIdAndUpdate(userId, { $addToSet: { likedLore: lore._id } });

    res.json({ likes: lore.likes, hasLiked: true });
  } catch (error) {
    console.error('Error liking lore:', error);
    res.status(500).json({ error: 'Server error while liking lore' });
  }
};

// Unlike a lore entry (user only)
const unlikeLore = async (req, res) => {
  try {
    const lore = await Lore.findById(req.params.id);
    if (!lore) {
      return res.status(404).json({ error: 'Lore entry not found' });
    }

    const userId = req.user.id;
    const userIndex = lore.likedBy.indexOf(userId);

    if (userIndex === -1) {
      return res.status(400).json({ error: 'You have not liked this lore entry' });
    }

    lore.likedBy.splice(userIndex, 1);
    lore.likes = lore.likedBy.length;
    await lore.save();

    // Update user document
    await User.findByIdAndUpdate(userId, { $pull: { likedLore: lore._id } });

    res.json({ likes: lore.likes, hasLiked: false });
  } catch (error) {
    console.error('Error unliking lore:', error);
    res.status(500).json({ error: 'Server error while unliking lore' });
  }
};

module.exports = {
  getAllLore,
  getLoreById,
  createLore,
  updateLore,
  deleteLore,
  likeLore,
  unlikeLore
};