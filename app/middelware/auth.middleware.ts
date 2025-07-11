import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import envConfig from '../config/env.config'
import { JwtPayload } from '../types/auth.types'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username?: string;
        role: string;
      }
    }
  }
}

export const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      try {
        const decodedToken = jwt.verify(token, envConfig.JWT_SECRET) as JwtPayload;
        req.user = {
          userId: decodedToken.id,
          email: decodedToken.email,
          role: decodedToken.role
        };
        return next();
      } catch (err) {
        // Access token invalid, try refresh token
      }
    }
    // Try refresh token
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decodedRefresh = jwt.verify(refreshToken, envConfig.JWT_REFRESH_SECRET) as JwtPayload;
        // Issue new access token
        const newAccessToken = jwt.sign(
          { id: decodedRefresh.id, email: decodedRefresh.email, role: decodedRefresh.role },
          envConfig.JWT_SECRET,
          { expiresIn: '15m' }
        );
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: envConfig.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
        req.user = {
          userId: decodedRefresh.id,
          email: decodedRefresh.email,
          role: decodedRefresh.role
        };
        return next();
      } catch (err) {
        // Refresh token invalid
        return res.redirect('/auth/login');
      }
    } else {
      // No refresh token
      return res.redirect('/auth/login');
    }
  } catch (error) {
    return res.redirect('/auth/login');
  }
}

export const verifyRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Refresh token not found"
      })
      return
    }

    const decodedToken = jwt.verify(token, envConfig.JWT_REFRESH_SECRET) as JwtPayload
    
    // Map the decoded token to the expected user structure
    req.user = {
      userId: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role
    }
    
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    })
  }
} 