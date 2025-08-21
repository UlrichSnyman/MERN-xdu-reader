// Mock data for demonstration when database is not available
const mockWorks = [
  {
    _id: '1',
    title: 'The Chronicles of Eldoria',
    synopsis: 'An epic fantasy tale of magic and adventure in the mystical realm of Eldoria.',
    category: 'library',
    likes: 42,
    pages: [
      {
        _id: 'p1',
        title: 'The Beginning',
        pageNumber: 1,
        createdAt: new Date('2024-01-01').toISOString()
      },
      {
        _id: 'p2',
        title: 'The Journey Starts',
        pageNumber: 2,
        createdAt: new Date('2024-01-02').toISOString()
      }
    ],
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    _id: '2',
    title: 'Modern Philosophy Essays',
    synopsis: 'A collection of thought-provoking essays on contemporary philosophical themes.',
    category: 'library',
    likes: 28,
    pages: [
      {
        _id: 'p3',
        title: 'Introduction to Modern Thought',
        pageNumber: 1,
        createdAt: new Date('2024-02-01').toISOString()
      }
    ],
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  }
];

const mockPages = [
  {
    _id: 'p1',
    title: 'The Beginning',
    content: 'In the mystical realm of Eldoria, where magic flows through every stone and tree, our story begins...\n\nThe ancient forests whispered secrets to those who knew how to listen, and the mountains held treasures beyond imagination. It was here that our hero, Aelyn, would discover their true destiny.\n\nAs the morning sun cast golden rays through the emerald canopy, Aelyn stepped onto the path that would change everything. Little did they know that this simple walk would lead to the greatest adventure of their lifetime.',
    work: {
      _id: '1',
      title: 'The Chronicles of Eldoria'
    },
    pageNumber: 1,
    likes: 15,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    navigation: {
      previous: null,
      next: {
        _id: 'p2',
        title: 'The Journey Starts',
        pageNumber: 2
      }
    }
  },
  {
    _id: 'p2',
    title: 'The Journey Starts',
    content: 'The path wound deeper into the forest, where ancient magic still lingered in the air...\n\nAelyn could feel the power emanating from the very ground beneath their feet. Each step forward was a step into the unknown, but also a step toward understanding their place in this vast, magical world.\n\nSuddenly, a figure emerged from behind one of the massive oak trees. Cloaked in midnight blue robes adorned with silver stars, the stranger\'s eyes held the wisdom of ages.\n\n"You seek the path to enlightenment," the figure spoke, their voice carrying the weight of prophecy. "But are you prepared for what you must sacrifice to achieve it?"',
    work: {
      _id: '1',
      title: 'The Chronicles of Eldoria'
    },
    pageNumber: 2,
    likes: 12,
    createdAt: new Date('2024-01-02').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
    navigation: {
      previous: {
        _id: 'p1',
        title: 'The Beginning',
        pageNumber: 1
      },
      next: null
    }
  },
  {
    _id: 'p3',
    title: 'Introduction to Modern Thought',
    content: '# Introduction to Modern Thought\n\nPhilosophy in the 21st century faces unprecedented challenges and opportunities...\n\nAs we navigate an increasingly complex world, the fundamental questions that have guided human inquiry for millennia take on new urgency and relevance. What does it mean to be human in an age of artificial intelligence? How do we find meaning in a seemingly chaotic universe?\n\n## The Digital Revolution and Human Identity\n\nThe rapid advancement of technology has forced us to reconsider our most basic assumptions about consciousness, identity, and what it means to be alive. We stand at the threshold of an era where the line between human and machine becomes increasingly blurred.\n\n*This essay explores these themes and their implications for how we understand ourselves and our place in the cosmos.*',
    work: {
      _id: '2',
      title: 'Modern Philosophy Essays'
    },
    pageNumber: 1,
    likes: 8,
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString(),
    navigation: {
      previous: null,
      next: null
    }
  }
];

const mockSuggestions = [
  {
    _id: 's1',
    content: 'Would love to see more fantasy works! The Chronicles of Eldoria was amazing.',
    authorName: 'Fantasy Lover',
    email: 'fantasy@example.com',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    _id: 's2',
    content: 'The rich text editor is fantastic! Makes reading so much more enjoyable.',
    authorName: 'Tech Enthusiast',
    createdAt: new Date('2024-02-10').toISOString(),
    updatedAt: new Date('2024-02-10').toISOString()
  }
];

const mockUser = {
  id: 'admin1',
  username: 'admin',
  role: 'admin'
};

module.exports = {
  mockWorks,
  mockPages,
  mockSuggestions,
  mockUser
};