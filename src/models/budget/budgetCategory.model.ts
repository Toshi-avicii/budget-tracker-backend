import { Document, model, Model, models, Schema } from "mongoose";

interface BudgetCategory extends Document {
    name: string;
};

type BudgetCategoryModel = Model<BudgetCategory>;

const budgetCategorySchema = new Schema<BudgetCategory, BudgetCategoryModel>({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        minlength: [3, 'Min. length must be 3 characters'],
        maxlength: [20, 'Max. length must be less than 3 characters'],
        trim: true,
        unique: [true, 'Category already exists']
    }
}, {
    timestamps: true
});

const budgetCategoryModel: BudgetCategoryModel = models.BudgetCategory || model<BudgetCategory, BudgetCategoryModel>('BudgetCategory', budgetCategorySchema, 'budgetCategories');

export default budgetCategoryModel;