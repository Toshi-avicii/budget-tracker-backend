import chatMessageModel from "../models/message.model";
import userModel from "../models/user.model";

class MessageService {
    static async getChatMessages({ user1, user2 }: { user1: string, user2: string }) {
        const sender = await userModel.findOne({ _id: user1 }).select("_id");
        const target = await userModel.findOne({ _id: user2 }).select("_id");
        const foundedMessages = await chatMessageModel.aggregate([
            {
                $match: {
                    $or: [
                        { from: sender?._id, to: target?._id },
                        { from: target?._id, to: sender?._id }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "from",
                    foreignField: "_id",
                    as: "from"
                }
            },
            {
                $unwind: {
                    path: "$from",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "to",
                    foreignField: "_id",
                    as: "to"
                }
            },
            {
                $unwind: {
                    path: "$to",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "chatmessages",        // same collection (self-join)
                    localField: "reply",   // the field in the current doc
                    foreignField: "_id",   // the field in the same collection to match with
                    as: "replyMessage"       // the output field with the joined message
                }
            },
            {
                $unwind: {
                    path: "$replyMessage",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'replyMessage.from',
                    foreignField: '_id',
                    as: 'replyFrom'
                }
            },
            {
                $unwind: {
                    path: '$replyFrom',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'replyMessage.to',
                    foreignField: '_id',
                    as: 'replyTo'
                }
            },
            {
                $unwind: {
                    path: '$replyTo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    from: {
                        id: "$from._id",
                        name: "$from.username"
                    },
                    to: {
                        id: "$to._id",
                        name: "$to.username"
                    },
                    message: 1,
                    createdAt: 1,
                    replyMessage: {
                        id: "$replyMessage._id",
                        message: "$replyMessage.message",
                        to: "$replyMessage.from",
                        from: "$replyMessage.to"
                    },
                    replyFrom: "$replyFrom.username",
                    replyTo: "$replyTo.username"
                }
            },
            {
                $sort: {
                    createdAt: 1
                }
            }
        ])

        if (foundedMessages) {
            return {
                success: true,
                data: foundedMessages
            }
        } else {
            return {
                success: false,
                data: []
            }
        }
    }
}

export default MessageService;