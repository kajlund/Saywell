import mongoose, { type HydratedDocument, type Model, Schema, type Types } from 'mongoose';

export interface ProverbDocument {
  userId: Types.ObjectId;
  title: string;
  author: string;
  content: string;
  description: string;
  lang: 'eng' | 'swe' | 'fin';
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const proverbSchema = new Schema<ProverbDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'Title is required'],
    },
    author: {
      type: String,
      trim: true,
      required: [true, 'Author is required'],
      index: true,
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'Content is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    lang: {
      type: String,
      trim: true,
      default: 'eng',
    },
    category: {
      type: String,
      trim: true,
      required: [true, 'Category is required'],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  { timestamps: true },
);

export type ProverbHydratedDocument = HydratedDocument<ProverbDocument>;

export const ProverbModel =
  (mongoose.models.Proverb as Model<ProverbDocument> | undefined) ??
  mongoose.model<ProverbDocument>('Proverb', proverbSchema);
