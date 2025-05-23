jest.setTimeout(35000);

import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import config from '../config';
import { Server } from 'http';

let server: Server;
let token: string;

beforeAll(async () => {
    await mongoose.connect(config.dbUrl); // replace with your test DB URI
    server = app.listen(5000);
    const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'tushar.toshi12@gmail.com', password: 'tushar@1202' });
    token = res.body.token; // adjust based on your API response
});

afterAll((done: jest.DoneCallback) => {
    mongoose.connection.close(); // or your DB equivalent
    mongoose.disconnect();
    server.close(() => {
        done()
    });
});

// DRY function
const sendBudgetRequestFn = (data: Object) => {
    return request(server)
    .post('/api/budget/add-new')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
}

// to get all the budgets by a user
test('GET /api/budget - it should return a list of budgets related to a user', async() => {
    const response = await request(server)
        .get('/api/budget')
        .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
});

// to get one budget by a user
test('GET /api/budget/:budgetId - it should return a budget based on id', async() => {
    let budgetId = '680ddec42865d59eb5793b2d';
    const response = await request(server)
    .get(`/api/budget/${budgetId}`)
    .set('Authorization', `Bearer ${token}`)
    
    if(response.body.error && response.body.error.type === 'CustomError') {
        expect(response.status).toBe(500);
    } else if(response.body.error && response.body.error.type === 'NotFoundError') {
        expect(response.status).toBe(404)
    } else {
        expect(response.status).toBe(200);
        expect(typeof response.body).toBe('object');
        expect(response.body).toHaveProperty('data');
    }
    
});

// tests with add-new handler
test('POST /api/budget/add-new - it should throw 400 error if budgetName is not given', async() => {
    const data = {
        budgetName: "",
        amount: 2000,
        budgetExpensePeriodType: "680dd84abc8e1f9448b71242",
        budgetExpenseType: "680dd759bc8e1f9448b71239",
        currencyCode: "INR"
    }

    const response = await sendBudgetRequestFn(data);
    expect(response.status).toBe(400);
});