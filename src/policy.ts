import mongoose from "mongoose";

export type Action = 'read:all' | 'write:all' | 'update:all' | 'delete:all' | 'read:own' | 
'write:own' | 'update:own' | 'delete:own' | 'create:own' | 'create:admin';
export type Resource = 'budget' | 'transaction' | 'budgetCategory' | 'budgetPeriod' | 'dashboard';
export type User = 'admin' | 'user';

export type Attributes = {
    user: {
        role: User;
        id: mongoose.Types.ObjectId;
    },
    resource: {
        id: Resource;
        createdBy: mongoose.Types.ObjectId;
    },
    environment: {
        time: Date;
        ip: string;
    }
}

type Policy = {
    action: Action;
    resource: Resource;
    description: string;
    condition: (attributes: Attributes) => boolean;
}

export const policy: Policy[] = [
    {
        action: 'read:own',
        description: 'Read all budgets created by the user',
        resource: 'budget',
        condition: function(attributes) {
            return (attributes.user.role !== 'admin' && attributes.user.id === attributes.resource.createdBy);
        },
    },
    {
        action: 'delete:own',
        description: "Delete one budget by user",
        resource: 'budget',
        condition(attributes) {
            return (attributes.user.role !== 'admin' && attributes.user.id === attributes.resource.createdBy);
        },
    },
    {
        action: 'update:own',
        description: "Update budget by user",
        resource: 'budget',
        condition(attributes) {
            return (attributes.user.role !== 'admin' && attributes.user.id === attributes.resource.createdBy)
        },
    },
    {
        action: 'create:own',
        description: "Create a budget by user",
        resource: 'budget',
        condition(attributes) {
            return (attributes.user.role !== 'admin' && attributes.user.id === attributes.resource.createdBy);
        },
    }
]