import mongoose, { Document, Model } from "mongoose";

interface BackofficeAttrs {
    userId: number
    userType: string
    role: string,
    email: string
}

interface BackofficeModel extends Model<BackofficeDoc> {
    build(attrs: BackofficeAttrs): BackofficeDoc
}

interface BackofficeDoc extends Document {
    userId: number
    userType: string
    role: string,
    email: string
}

const backofficeSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
        unique: true,
    },
    userType: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },  
    email: {
        type: String,
        required: true
    },  
}, { timestamps: true, versionKey: false })

backofficeSchema.statics.build = (attrs: BackofficeAttrs) => {
    return new Backoffice(attrs)
}

const Backoffice = mongoose.model<BackofficeDoc, BackofficeModel>('Backoffice', backofficeSchema)

export { Backoffice }