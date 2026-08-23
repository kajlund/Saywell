import mongoose from 'mongoose';

const ProverbSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    index: true,
  },
  title: {
    type: String, 
    trim: true,
    required: [ true, 'Title is required'],
  },
  author: {
    type: String, 
    trim: true,
    required: [ true, 'Author is required'],
    index: true,
  },
  content: {
    type: String,
    trim: true,
    required: [ true, 'Content is required'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  lang: {
    type: String,
    trim: true,
    default: 'en',
  },
  category: {
    type: String,
    trim: true, 
    required: [ true, 'Category is required'],
  },
  tags: {
    type: [String],
    trim: true,
    default: [],
    index: true,
  },
},
{
  timestamps: true, // Automatically manages createdAt and updatedAt
});

const Proverb = mongoose.model('Proverb', ProverbSchema);
export default Proverb;
