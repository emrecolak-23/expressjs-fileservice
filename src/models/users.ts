import mongoose, { Document, Model } from "mongoose";

interface UserAttrs {
    userId: number
    name: string
    surname: string,
    personalInfoStatus?: string,
    resumeStatus?: string,
}

interface UserModel extends Model<UserDoc> {
    build(attrs: UserAttrs): UserDoc
}

interface UserDoc extends Document {
    userId: number
    name: string
    surname: string,
    personalInfoStatus?: string,
    resumeStatus?: string,
}

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    personalInfoStatus: {
        type: String,
        required: false
    },
    resumeStatus: {
        type: String,
        required: false
    }
}, { timestamps: true, versionKey: false })

userSchema.statics.build = (attrs: UserAttrs) => {
    return new User(attrs)
}

const User = mongoose.model<UserDoc, UserModel>('User', userSchema)

export { User }