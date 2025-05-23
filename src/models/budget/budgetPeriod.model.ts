import { model, Model, models, Schema } from "mongoose";

interface BudgetPeriod extends Document {
    name: string;
}

type BudgetPeriodModel = Model<BudgetPeriod>;

const budgetPeriodSchema = new Schema<BudgetPeriod>({
    name: {
        type: String,
        required: [true, 'Period name is required'],
        minlength: [3, 'Min. length must be 3 characters'],
        maxlength: [20, 'Max. length must be less than 3 characters'],
        trim: true,
        unique: [true, 'Period already exists']
    }
}, {
    timestamps: true
});

const budgetPeriodModel: BudgetPeriodModel = models.BudgetPeriod || model<BudgetPeriod, BudgetPeriodModel>('BudgetPeriod', budgetPeriodSchema, 'budgetPeriods');

export default budgetPeriodModel; 