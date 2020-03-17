import User from '../models/User';

export default async (req, res, next) => {
  const { originalUrl: url, userId } = req;

  if (url.startsWith('/deliverymen')) {
    if (!(await User.isAdministrator(userId))) {
      return res
        .status(401)
        .json({ error: 'User is not allowed to access this resource.' });
    }
  }

  return next();
};
