const Lore = require('../models/Lore');

// Get all lore entries (public)
const getAllLore = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    
    const lore = await Lore.find(filter)
      .select('title category likes createdAt')
      .sort({ createdAt: -1 });
    
    res.json(lore);
  } catch (error) {
    console.error('Error fetching lore:', error);
    res.status(500).json({ error: 'Server error while fetching lore' });
  }
};

// Get lore by ID (public)
const getLoreById = async (req, res) => {
  try {
    const lore = await Lore.findById(req.params.id);
    
    if (!lore) {
      return res.status(404).json({ error: 'Lore entry not found' });
    }
    
    res.json(lore);
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

// Like a lore entry (public)
const likeLore = async (req, res) => {
  try {
    const lore = await Lore.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    
    if (!lore) {
      return res.status(404).json({ error: 'Lore entry not found' });
    }
    
    res.json({ likes: lore.likes });
  } catch (error) {
    console.error('Error liking lore:', error);
    res.status(500).json({ error: 'Server error while liking lore' });
  }
};

module.exports = {
  getAllLore,
  getLoreById,
  createLore,
  updateLore,
  deleteLore,
  likeLore
};