import mongoose, { Document, model, Model, models } from "mongoose";

interface ChatMessage extends Document {
    from: mongoose.Schema.Types.ObjectId;
    to: mongoose.Schema.Types.ObjectId;
    message: String;
    reply?: mongoose.Schema.Types.ObjectId
}

type ChatMessageModel = Model<ChatMessage>;

const chatMessageSchema = new mongoose.Schema<ChatMessage, ChatMessageModel>({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'From User is required'],
        validate: {
            validator: async function (value) {
                const User = mongoose.model('User');
                const exists = await User.exists({ _id: value });
                return exists;
            },
            message: props => `"${props.value}" is not a valid user.`,
        }
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'To User is required'],
        validate: {
            validator: async function(value) {
                const User = mongoose.model('User');
                const exists = await User.exists({ _id: value });
                return exists;
            },
            message: props => `"${props.value}" is not a valid user`
        }
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
    },
    reply: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
        required: false,
        validate: {
            validator: async function(value) {
                const ReplyMessage = mongoose.model('ChatMessage');
                const exists = await ReplyMessage.exists({ _id: value });
                return exists;
            },
            message: props => `"${props.value}" is not a valid message`
        }
    }
}, {
    timestamps: true
});

chatMessageSchema.index({ from: 'asc', to: 'asc' });

const chatMessageModel: ChatMessageModel = models.chatMessage || model<ChatMessage, ChatMessageModel>('ChatMessage', chatMessageSchema);

export default chatMessageModel;