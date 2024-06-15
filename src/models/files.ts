import mongoose, { Schema, Document, Model } from "mongoose";

interface FileAttrs {
  name: string;
  path: string;
  size: number;
  mime: string;
  userId: number;
  user_type: string;
  fileType: string;
  isActive: boolean;
  isExpired: boolean;
  fileETag: string;
}

interface FileDoc extends Document {
  _id: string;
  name: string;
  path: string;
  size: number;
  mime: string;
  userId: number;
  user_type: string;
  fileType: string;
  isActive: boolean;
  isExpired: boolean;
  fileETag: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FileModel extends Model<FileDoc> {
  build(attrs: FileAttrs): FileDoc;
}

const filesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mime: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    user_type: {
      type: String,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
    },
    isExpired: {
      type: Boolean,
      required: true,
      default: false,
    },
    fileEtag: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

filesSchema.statics.build = (attrs: FileAttrs) => {
  return new Files(attrs);
};

const Files = mongoose.model<FileDoc, FileModel>("Files", filesSchema);

export { Files };
