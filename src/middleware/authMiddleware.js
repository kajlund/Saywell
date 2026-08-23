import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

function toObjectId(idStr) {
    if (typeof idStr !== 'string') idStr = String(idStr || '');
    if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
        return idStr;
    }
    return crypto.createHash('md5').update(idStr).digest('hex').substring(0, 24);
}

import { ForbiddenError, UnauthorizedError } from '../errors.js';

export function getAuthMiddleware(cnf, log) {

  const verifyAccessToken = (token) => {
    try {
      const decoded = jwt.verify(token, cnf.jwtSecret);
      if (decoded) {
        const rawId = decoded.sub || decoded.id || decoded.userId || decoded.email || decoded.username;
        decoded.id = toObjectId(rawId);
        return decoded;
      }
      return null;
    } catch (err) {
      log.error(err);
      return null;
    }
  };


  return {
    checkRole: (role) => {
      return function (req, res, next) {
        if (req.user?.role === role) return next();
        next(
          new ForbiddenError(
            `You are not autorized for this route as a user with role ${req.user?.role}`,
          ),
        );
      };
    },
    isAuthenticated: async (req, res, next) => {
      try {
        // Ensure we have a token or throw unauhtorized error
        const token =
          req.cookies?.accessToken ||
          req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new UnauthorizedError('Invalid credentials');
        // Verify token or throw unauhtorized error
        const verified = await verifyAccessToken(token);

        // If verified add user info to request
        if (!verified) next(new UnauthorizedError('Invalid credentials'));
        req.user = verified;
        next();
      } catch (error) {
        next(error);
      }
    }
  };
}
