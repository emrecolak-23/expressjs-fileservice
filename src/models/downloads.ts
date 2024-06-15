import mongoose, { Schema, Document, Model } from "mongoose";


interface IDownloadAttrs {
    fileKey: string;
    count: number
    userId: number
}



interface IDownloadDocument extends Document {
    fileKey: string;
    count: number
    userId: number
    createdAt: Date;
    updatedAt: Date;
}


interface IDownloadModel extends Model<IDownloadDocument> {
    build(attrs: IDownloadAttrs): IDownloadDocument;
}

const DownloadSchema = new Schema({
    fileKey: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
    userId: {
        type: Number,
        required: true
    }
}, {
    timestamps: true, versionKey: false, expires: "1d"
})


DownloadSchema.statics.build = (attrs: IDownloadAttrs) => {
    return new Download(attrs);
};

const Download = mongoose.model<IDownloadDocument, IDownloadModel>('Download', DownloadSchema);

export { Download };