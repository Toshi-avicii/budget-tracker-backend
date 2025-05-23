import { Request, Response, Router } from "express";

const testRoutes = Router();

testRoutes.get("/", async (req: Request, res: Response) => {
    try {
      res.status(200).json({ 
        message: 'Test API success'
      });
    } catch (error) {
      if(error instanceof Error) {
          res.status(400).json({ message: error.message });
      }
    }
})

export default testRoutes;