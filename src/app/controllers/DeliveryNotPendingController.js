import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import Recipient from '../models/Recipient';

class DeliveryNotPendingController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const { deliverymanId } = req.params;

    const deliverymanExists = await Deliveryman.findByPk(deliverymanId);

    if (!deliverymanExists) {
      return res
        .status(404)
        .json({ error: `Deliveryman of id ${deliverymanId} not found` });
    }

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: deliverymanId,
        canceled_at: null,
        end_date: { [Op.ne]: null },
      },
      order: ['id'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: {
        exclude: [
          'createdAt',
          'updatedAt',
          'recipient_id',
          'canceled_at',
          'deliveryman_id',
          'signature_id',
        ],
      },
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'city',
            'state',
            'zip_code',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.status(200).json(deliveries);
  }
}

export default new DeliveryNotPendingController();
