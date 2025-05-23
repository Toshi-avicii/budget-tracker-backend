import { NextFunction, Request, Response } from "express";
import AuthService from "../services/auth.service";
import logger from "../utils/logger";
import { AuthenticationError } from "../utils/errors";

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AuthService.signUp(req.body);
    logger.info("User created successfully");
    res.status(200).json({ data });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error occurred", { message: error.message });
      // res.status(400).json({ message: error.message });
      next(error);
    }
  }
};

export const setTokenCookie = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.setTokenCookie(req.body);
    if (result) {
      res.status(200).cookie('token', result, {
        maxAge: (60 * 60 * 24 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      }).json({
        message: 'Cookie set'
      })
    } else {
      throw new AuthenticationError('Token Error');
    }
  } catch (err) {
    if (err instanceof Error) {
      logger.error("Error occurred", { message: err.message });
      // res.status(400).json({ message: err.message });
      next(err);
    }
  }
}

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
  res.status(200).json({ message: 'Logout successfully' })
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.login(req.body);
    logger.info("User authenticated and logged in successfully");
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      logger.error("Error occurred", { message: err.message });
      next(err);
    }
  }
}

export const sendResetLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.resetLinkHelper(req.body);
    logger.info("forgot password API hit successfully");
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      logger.error("Error occurred", { message: err.message });
      // res.status(400).json({ message: err.message });
      next(err);
    }
  }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.resetPassword(req.body);
    if (result instanceof Error) {
      throw new AuthenticationError(result.message);
    }
    logger.info("forgot password API hit successfully");
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      logger.error("Error occurred", { message: err.message });
      // res.status(400).json({ message: err.message });
      next(err)
    }
  }
}

export const googleSignIn = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.googleSignIn(req.body);
    if (result instanceof Error) {
      throw new AuthenticationError(result.message);
    }
    logger.info("Google Sign In API hit successfully");
    res.status(200).json(result);
  } catch(err) {
    if (err instanceof Error) {
      logger.error("Error occurred", { message: err.message });
      // res.status(400).json({ message: err.message });
      next(err);
    }
  }
}