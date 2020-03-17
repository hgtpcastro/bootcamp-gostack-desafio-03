import * as Yup from 'yup';

import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import Recipient from '../models/Recipient';

class DeliveryEndsController {
  async update(req, res) {
    const schema = Yup.object().shape({
      signature_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'A signature is required to conclude a delivery' });
    }

    const { deliverymanId, deliveryId } = req.params;

    const delivery = await Delivery.findOne({
      where: {
        id: deliveryId,
        deliveryman_id: deliverymanId,
      },
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

    if (!delivery) {
      return res
        .status(400)
        .json({ error: `Delivery of id ${deliveryId} not found.` });
    }

    if (Delivery.canceled_at) {
      return res
        .status(400)
        .json({ error: `Delivery of id ${deliveryId} canceled.` });
    }

    if (delivery.start_date === null) {
      return res
        .status(400)
        .json({ error: 'You can not conclude an delivery withot start date' });
    }

    const { signature_id } = req.body;

    const signatureExists = await File.findByPk(signature_id);

    if (!signatureExists) {
      return res
        .status(400)
        .json({ error: `Signature of id ${signature_id} not found` });
    }

    delivery.end_date = new Date();
    delivery.signature_id = signature_id;

    await delivery.save();

    return res.status(200).json(delivery);
  }
}

export default new DeliveryEndsController();
