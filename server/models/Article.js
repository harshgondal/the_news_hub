import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    default: 'general',
    enum: ['general', 'business', 'technology', 'sports', 'entertainment', 'health', 'science', 'politics', 'finance']
  },
  content: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster searches
articleSchema.index({ title: 'text', description: 'text', content: 'text' });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ source: 1 });
articleSchema.index({ category: 1 });

const Article = mongoose.model('Article', articleSchema);

export default Article;
