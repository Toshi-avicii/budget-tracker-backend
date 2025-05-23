import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import userModel from "../models/user.model";
import { MongooseError } from "mongoose";
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { AuthenticationError, CustomError, ValidationError } from "../utils/errors";

interface AuthReqBody {
  username: string;
  email: string;
  password: string;
}

interface AuthLoginReqBody {
  email: string;
  password: string;
}

interface TokenBody {
  token: string;
}

interface ResetLinkDecodedPayload extends JwtPayload {
  id: string;
}

class AuthService {
  static async signUp({ username, email, password }: AuthReqBody) {
    const body = { username, email, password };
    try {
      const newUser = await userModel.create({ ...body, isSignedUpWithGoogle: false });
      if (newUser instanceof Error) {
        throw new Error('Error occurred');
      }
      const signedJwtToken = jwt.sign(
        { username, email, role: 'user' },
        config.jwtSecret,
        { expiresIn: '1day' }
      );
      return {
        username: newUser.username,
        email: newUser.email,
        token: signedJwtToken,
        isSignedUpWithGoogle: newUser.isSignedUpWithGoogle
      };
    } catch (err) {
      if (err instanceof MongooseError) {
        throw new AuthenticationError(err.message);
      }
    }
  }

  static async setTokenCookie({ token }: TokenBody) {
    try {
      if (token) {
        const isValidToken: jwt.JwtPayload | string = jwt.verify(token, config.jwtSecret);
        if (typeof isValidToken !== 'string') {
          let expTime = isValidToken.exp! * 1000;
          // checking for token expiry
          if (expTime < new Date().getTime()) {
            throw new Error('Token has expired');
          } else {
            return token;
          }
        }
      } else {
        throw new AuthenticationError('Token is not valid')
      }

    } catch (error) {
      if (error instanceof Error) {
        throw new AuthenticationError(error.message);
      }
    }
  }

  static async login({ email, password }: AuthLoginReqBody) {
    try {
      const existingUser = await userModel.findOne({ email }).select("+password");
      if (!existingUser) {
        throw new AuthenticationError("User does not exist");
      } else {
        // compare password
        const isSamePassword = await existingUser.comparePassword(password);
        if (!isSamePassword) {
          throw new ValidationError("Passwords do not match");
        } else {
          const signedJwtToken = jwt.sign(
            {
              username: existingUser.username,
              email: existingUser.email,
              role: 'user'
            },
            config.jwtSecret,
            { expiresIn: '1day' }
          );

          const updatedUser = await userModel.findOneAndUpdate(
            { email }, 
            { isSignedUpWithGoogle: false, forgotPasswordToken: null, googleUserName: null }, 
            { new: true }
          ).select("+isSignedUpWithGoogle");
        
          return {
            username: existingUser.username,
            email: existingUser.email,
            token: signedJwtToken,
            isSignedUpWithGoogle: updatedUser?.isSignedUpWithGoogle
          };
        }
      }
    } catch (err) {
      if (err instanceof Error || err instanceof MongooseError) {
        throw new AuthenticationError(err.message);
      }
    }
  }

  static async resetLinkHelper({ email }: { email: string }) {
    try {
      const existingUser = await userModel.findOne({ email }, { email: 1, username: 1, _id: 1 });
      if (!existingUser) throw new Error("User not found");

      // create a token that will be valid for 15 minutes
      const token = jwt.sign({ id: existingUser._id }, config.jwtSecret, { expiresIn: '15m' });
      const saveDataInExistingUser = await userModel.findOneAndUpdate({ email }, { forgotPasswordToken: token }, { new: true });

      if (saveDataInExistingUser) {
        const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;
        // sent email to the recepient
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: config.senderMailId,
            pass: config.mailAppPassword
          }
        });

        const mailOptions = {
          from: config.senderMailId,
          to: existingUser.email,
          subject: "Password Reset Request",
          // text: "Hello! This is a test email sent using Nodemailer.",
          html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });

        return {
          message: "Password reset link sent to email.",
        }
      } else {
        throw new CustomError('Some error occurred');
      }


    } catch (err) {
      if (err instanceof Error) {
        throw new CustomError(err.message);
      }
    }
  }

  static async resetPassword({ token, password }: { token: string, password: string }) {
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret) as ResetLinkDecodedPayload;
      const user = await userModel.findById(decoded?.id).select("+forgotPasswordToken");

      if (!user || user.forgotPasswordToken !== token) throw new AuthenticationError("Invalid or expired token");

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedUser = await userModel.findOneAndUpdate({ _id: decoded.id }, { password: hashedPassword }, { new: true });
      if(updatedUser) {
        return { message: "Password reset successful." }
      } else {
        throw new AuthenticationError("Password update error occurred");
      }
    } catch (error) {
      if(error instanceof Error) {
        throw new AuthenticationError(error.message);
      }
    }
  }

  static async googleSignIn({ expires, userData }: { expires: string, userData: { name: string, image: string, email: string } }) {
   try {
    const body = {
      expires,
      userData: {
        name: userData.name,
        image: userData.image,
        email: userData.email
      }
    }

    const existingUser = await userModel.findOne({ email: body.userData.email });

    // if this user already existing then don't overwrite email, password but updated the "isSignedUpWithGoogle" key 
    // and generate token based on the "expiresIn" key
    if(existingUser) {
      const updatedUser = await userModel.findOneAndUpdate(
        { email: existingUser.email }, 
        { isSignedUpWithGoogle: true, 
          googleUserName: body.userData.name, 
          avatarUrl: body.userData.image, 
          forgotPasswordToken: null
        },
        { new: true }
      ).select("+isSignedUpWithGoogle");

      if(updatedUser) {
        // make the token and send it as a cookie
        const signedJwtToken = jwt.sign(
          {
            username: updatedUser.username,
            email: updatedUser.email,
            role: 'user'
          },
          config.jwtSecret,
          { expiresIn: '1day' }
        );

        return {
          username: updatedUser.googleUserName,
          email: updatedUser.email,
          token: signedJwtToken,
          isSignedUpWithGoogle: updatedUser?.isSignedUpWithGoogle,
          avatarUrl: updatedUser?.avatarUrl
        };

      } else {
        throw new AuthenticationError('Could not update user');
      }

    } else {
      // if the user does not exist then make a new entry in the db
      const newUser = await userModel.create({
        username: body.userData.name,
        email: body.userData.email,
        isSignedUpWithGoogle: true,
        googleUserName: body.userData.name,
        avatarUrl: body.userData.image
      });

      if(newUser) {
        const selectNewUser = await userModel.findOne({ email: body.userData.email }).select("+isSignedUpWithGoogle");
        const signedJwtToken = jwt.sign(
          {
            username: selectNewUser?.username,
            email: selectNewUser?.email
          },
          config.jwtSecret,
          { expiresIn: '1day' }
        );

        return {
          username: selectNewUser?.username,
          email: selectNewUser?.email,
          token: signedJwtToken,
          isSignedUpWithGoogle: selectNewUser?.isSignedUpWithGoogle,
          avatarUrl: selectNewUser?.avatarUrl
        };
      } else {
        throw new AuthenticationError('Could not create a new user');
      }
    }

   } catch(err) {
    if(err instanceof Error) {
      throw new Error(err.message);
    }
   } 
  }
}

export default AuthService;
