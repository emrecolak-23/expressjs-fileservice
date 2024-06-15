import mongoose, { Schema, Document, Model } from "mongoose";

interface BriefcaseAttrs {
  files: string[];
  userId: number;
  user_type: string;
}

interface BriefcaseDoc extends Document {
  _id: string;
  files: string[];
  userId: number;
  user_type: string;
}

interface BriefcaseModel extends Model<BriefcaseDoc> {
  build(attrs: BriefcaseAttrs): BriefcaseDoc;
}

const briefcaseSchema = new Schema(
  {
    files: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Files",
          required: true,
        },
      ],
      required: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    user_type: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

briefcaseSchema.statics.build = (attrs: BriefcaseAttrs) => {
  return new Briefcase(attrs);
};

const Briefcase = mongoose.model<BriefcaseDoc, BriefcaseModel>(
  "Briefcase",
  briefcaseSchema
);

export { Briefcase };
