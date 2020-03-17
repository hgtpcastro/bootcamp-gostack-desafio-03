import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import authMiddleware from './app/middlewares/auth';
import deliverymenMiddleware from './app/middlewares/deliverymen';

import DeliveryController from './app/controllers/DeliveryController';
import DeliveryEndsController from './app/controllers/DeliveryEndsController';
import DeliverymanController from './app/controllers/DeliverymanController';
import DeliveryNotPendingController from './app/controllers/DeliveryNotPendingController';
import DeliveryPendingController from './app/controllers/DeliveryPendingController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';
import DeliveryStartsController from './app/controllers/DeliveryStartsController';
import FileController from './app/controllers/FileController';
import RecipientController from './app/controllers/RecipientController';
import SessionController from './app/controllers/SessionController';
import UserController from './app/controllers/UserController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/session', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

// recipients basic CRUD
routes.get('/recipients', RecipientController.index);
routes.get('/recipients/:id', RecipientController.show);
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);
routes.delete('/recipients/:id', RecipientController.delete);

// deliverymen services
routes.put(
  '/deliverymen/:deliverymanId/starts-delivery/:deliveryId',
  DeliveryStartsController.update
);
routes.put(
  '/deliverymen/:deliverymanId/ends-delivery/:deliveryId',
  DeliveryEndsController.update
);
routes.get(
  '/deliverymen/:deliverymanId/deliveries/pending',
  DeliveryPendingController.index
);
routes.get(
  '/deliverymen/:deliverymanId/deliveries',
  DeliveryNotPendingController.index
);
// deliverymen Middleware
routes.use(deliverymenMiddleware);
// deliverymen basic CRUD
routes.get('/deliverymen', DeliverymanController.index);
routes.get('/deliverymen/:id', DeliverymanController.show);
routes.post('/deliverymen', DeliverymanController.store);
routes.put('/deliverymen/:id', DeliverymanController.update);
routes.delete('/deliverymen/:id', DeliverymanController.delete);

// deliveries basic CRUD
routes.get('/deliveries', DeliveryController.index);
routes.get('/deliveries/:id', DeliveryController.show);
routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries/:id', DeliveryController.update);
routes.delete('/deliveries/:id', DeliveryController.delete);

// deliveries problems
routes.get('/deliveries/problems', DeliveryProblemController.index);
routes.get('/deliveries/:id/problems', DeliveryProblemController.index);
routes.post('/deliveries/:id/problems', DeliveryProblemController.store);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
