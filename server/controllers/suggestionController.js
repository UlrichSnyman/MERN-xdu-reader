const Suggestion = require('../models/Suggestion');

// Get all suggestions (admin only)
const getAllSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find()
      .sort({ createdAt: -1 });
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Server error while fetching suggestions' });
  }
};

// Create new suggestion (public)
const createSuggestion = async (req, res) => {
  try {
    const { content, authorName, email } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const suggestion = new Suggestion({
      content,
      authorName,
      email
    });
    
    await suggestion.save();
    res.status(201).json({ 
      message: 'Suggestion submitted successfully',
      suggestion: {
        id: suggestion._id,
        content: suggestion.content,
        timestamp: suggestion.timestamp
      }
    });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ error: 'Server error while creating suggestion' });
  }
};

// Delete suggestion (admin only)
const deleteSuggestion = async (req, res) => {
  try {
    const suggestion = await Suggestion.findByIdAndDelete(req.params.id);
    
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    res.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ error: 'Server error while deleting suggestion' });
  }
};

module.exports = {
  getAllSuggestions,
  createSuggestion,
  deleteSuggestion
};