import * as Yup from 'yup';

import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import DeliveryProblem from '../models/DeliveryProblem';
import File from '../models/File';
import Recipient from '../models/Recipient';

import CancelDelivery from '../jobs/CancelDelivery';
import Queue from '../../lib/Queue';

class DeliveryProblemController {
  async index(req, res) {
    const { id } = req.params;
    const pageLimit = 10;
    const { page = 1 } = req.query;
    let whereObject = {};

    if (id) {
      const deliveryExists = await Delivery.findByPk(id);

      if (!deliveryExists) {
        return res
          .status(404)
          .json({ error: `Delivery of id ${id} not found.` });
      }
    }

    if (id) {
      whereObject = {
        delivery_id: id,
      };
    }

    const problems = await DeliveryProblem.findAll({
      where: whereObject,
      order: [['created_at', 'DESC']],
      limit: pageLimit,
      offset: (page - 1) * pageLimit,
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'deleted_at', 'delivery_id'],
      },
      include: [
        {
          model: Delivery,
          as: 'delivery',
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
        },
      ],
    });

    if (!problems) {
      return res
        .status(404)
        .json({ error: 'There are no problems with this delivery.' });
    }

    return res.status(200).json(problems);
  }

  async store(req, res) {
    const { id } = req.params;
    const { description } = req.body;

    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    const delivery = await Delivery.findByPk(id);

    if (!delivery) {
      return res.status(404).json({ error: `Delivery of id ${id} not found.` });
    }

    if (delivery.canceled_at) {
      return res.status(404).json({ error: 'Delivery is canceled.' });
    }

    const problem = await DeliveryProblem.create({
      delivery_id: id,
      description,
    });

    await problem.reload({
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'deleted_at', 'delivery_id'],
      },
      include: [
        {
          model: Delivery,
          as: 'delivery',
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
        },
      ],
    });

    return res.status(201).json(problem);
  }

  async delete(req, res) {
    const { id } = req.params;

    const problem = await DeliveryProblem.findByPk(id);

    if (!problem) {
      return res.status(404).json({ error: `Problem of id ${id} not found.` });
    }

    const delivery = await Delivery.findByPk(problem.delivery_id, {
      attributes: {
        exclude: [
          'createdAt',
          'updatedAt',
          'recipient_id',
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
      return res.status(404).json({ error: `Delivery of id ${id} not found.` });
    }

    if (delivery.canceled_at) {
      return res
        .status(404)
        .json({ error: 'This delivery has already been canceled.' });
    }

    await delivery.update({ canceled_at: new Date() });

    delivery.description = problem.description;

    /**
     * Quando uma encomenda for cancelada, o entregador deve receber um e-mail
     * informando-o sobre o cancelamento.
     */
    await Queue.add(CancelDelivery.key, { delivery });

    return res.status(200).json(delivery);
  }
}

export default new DeliveryProblemController();
