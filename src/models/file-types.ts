import mongoose, { Schema, Document, Model } from "mongoose";

interface FileTypesAttrs {
    name: string,
    isMultiple: boolean,
    extension: string[],
    mime: string[],
    isBrifcase: boolean,
    requiredPersonalInfoStatus: boolean,
    requiredResumeStatus: boolean,
}

interface FileTypesDoc extends Document {
    _id: string,
    name: string,
    isMultiple: boolean,
    extension: string[],
    mime: string[],
    isBrifcase: boolean,
    requiredPersonalInfoStatus: boolean,
    requiredResumeStatus: boolean,
    createdAt: Date,
    updatedAt: Date
}

const fileTypesSchema = new Schema({
    fileType: {
        type: String,
        required: true
    },
    isMultiple: {
        type: Boolean,
        required: true
    },
    extension: {
        type: Array,
        required: true
    },
    mime: {
        type: Array,
        required: true
    },
    isBrifcase: {
        type: Boolean,
        required: true,
        default: false
    },
    requiredPersonalInfoStatus: {
        type: Number,
        default: false
    },
    requiredResumeStatus: {
        type: Number,
        default: false
    },
    userType: {
        type: String,
        required: true,
    }
}, {
    timestamps: true


})


interface FileTypesModel extends Model<FileTypesDoc> {
    build(attrs: FileTypesAttrs): FileTypesDoc
}

fileTypesSchema.statics.build = (attrs: FileTypesAttrs) => {
    return new FileTypes(attrs)
}

const FileTypes = mongoose.model<FileTypesDoc, FileTypesModel>('FileTypes', fileTypesSchema)

export { FileTypes }