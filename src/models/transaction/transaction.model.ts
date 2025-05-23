import mongoose, { model, Model, models } from "mongoose";

type PaymentOptions = 'card' | 'cash' | 'online';
type TransactionOptions = 'income' | 'expense';

interface Transaction extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    budgetId: mongoose.Schema.Types.ObjectId;
    amount: number;
    type: TransactionOptions,
    description?: string;
    date: Date;
    paymentMethod: PaymentOptions;
    expenseType?: mongoose.Schema.Types.ObjectId;
    isRecurring: boolean;
}

type TransactionModel = Model<Transaction>;

const transactionSchema = new mongoose.Schema<Transaction, TransactionModel>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        validate: {
            validator: async function (value) {
                const User = mongoose.model('User');
                const exists = await User.exists({ _id: value });
                return exists;
            },
            message: props => `"${props.value}" is not a valid user.`,
        }
    },
    budgetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Budget',
        required: [true, 'Budget is required'],
        validate: {
            validator: async function (value) {
                const Budget = mongoose.model('Budget');
                const exists = await Budget.exists({ _id: value });
                return exists;
            },
            message: (props) => `${props.value} is not a valid budget`
        }
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [10, 'Minimum amount is 10'],
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Type is required']
    },
    description: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now,
        required: [true, 'Date is required'],
        validate: {
            validator: function (value) {
                return !isNaN(Date.parse(value));
            },
            message: 'Invalid date format. Please use a valid ISO string or Date object.'
        }
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'cash', 'online'],
        required: [true, 'Payment method is required']
    },
    expenseType: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        validate: {
            validator: async function (value) {
                const ExpenseType = mongoose.model('BudgetCategory');
                const exists = await ExpenseType.exists({ _id: value });
                return exists;
            },
            message: (props) => `${props.value} is not a valid expense type`
        }
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

transactionSchema.index({ type: 'text', userId: 'asc', budgetId: 'asc' });

const transactionModel: TransactionModel = models.Transaction || model<Transaction, TransactionModel>('Transaction', transactionSchema);

export default transactionModel;