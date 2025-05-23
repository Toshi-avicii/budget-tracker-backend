import mongoose, { Document, model, Model, models, Schema } from "mongoose";

type allowedCurrencyTypes = 'INR' | 'USD' | 'GBP';

interface Budget extends Document {
    name: string;
    amount: number;
    expensePeriodType: mongoose.Schema.Types.ObjectId;
    expenseType: mongoose.Schema.Types.ObjectId;
    currencyCode: allowedCurrencyTypes;
    createdBy: mongoose.Schema.Types.ObjectId;
}

type BudgetModel = Model<Budget>;

const budgetSchema = new Schema<Budget, BudgetModel>({
    name: {
        type: String,
        required: [true, 'Budget name is required'],
        trim: true,
        minlength: [3, 'Budget should be at least 3 characters long'],
        maxlength: [75, 'Budget should be no longer than 75 characters long']
    }, 
    amount: {
        type: Number,
        required: [true, 'Budget amount is required'],
        min: [100, 'Budget amount should be at least 100'],
    },
    expensePeriodType: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Budget expense period is required'],
        ref: 'BudgetPeriod',
        validate: {
            validator: async function (value) {
                const BudgetPeriod = mongoose.model('BudgetPeriod');
                const exists = await BudgetPeriod.exists({ _id: value });
                return exists;
              },
            message: props => `"${props.value}" is not a valid Expense Period Type.`,
        }
    },
    expenseType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BudgetCategory',
        required: [true, 'Budget expense type is required'],
        validate: {
            validator: async function (value) {
                const BudgetCategory = mongoose.model('BudgetCategory');
                const exists = await BudgetCategory.exists({ _id: value });
                return exists;
              },
              message: 'Invalid budget category selected',
        }
        // enum: ['food', 'transport', 'healthcare', 'education', 'clothes', 'entertainment', 'miscellanous']
        
    },
    currencyCode: {
        type: String,
        required: [true, 'Currency code is required'],
        enum: ['INR', 'USD', 'GBP']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is necessary to create a budget'],
        validate: {
            validator: async function (value) {
                const User = mongoose.model('User');
                const exists = await User.exists({ _id: value });
                return exists;
              },
              message: 'Invalid user',
        }
    }
}, {
    timestamps: true
});

const budgetModel: BudgetModel = models.Budget || model<Budget, BudgetModel>('Budget', budgetSchema);

export default budgetModel;