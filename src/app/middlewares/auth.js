import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token does not provide.' });
  }

  try {
    const [, token] = authHeader.split(' ');
    const payLoad = await promisify(jwt.verify)(token, authConfig.secret);
    req.userId = payLoad.id;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};
