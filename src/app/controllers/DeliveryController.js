import * as Yup from 'yup';
import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import Recipient from '../models/Recipient';

import NewDelivery from '../jobs/NewDelivery';
import Queue from '../../lib/Queue';

class DeliveryController {
  async index(req, res) {
    const { page = 1, q } = req.query;
    let whereObject = { canceled_at: null };

    if (q) {
      whereObject = {
        produtct: { [Op.like]: `%${q}%` },
        canceled_at: null,
      };
    }

    const deliveries = await Delivery.findAll({
      where: whereObject,
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

    res.status(200).json(deliveries);
  }

  async show(req, res) {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
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
      return res.status(404).json({ error: `Delivery of id ${id} not found.` });
    }

    if (Delivery.canceled_at) {
      return res.status(404).json({ error: `Delivery of id ${id} canceled.` });
    }

    const {
      product,
      start_date,
      end_date,
      signature,
      recipient,
      deliveryman,
    } = delivery;

    return res.status(200).json({
      id,
      product,
      start_date,
      end_date,
      signature,
      recipient,
      deliveryman,
    });
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Validation failed.');
    }

    const { recipient_id, deliveryman_id } = req.body;

    const recipient = await Recipient.findOne({
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'deleted_at'],
      },
      where: {
        id: recipient_id,
        deleted_at: null,
      },
    });

    if (!recipient) {
      return res
        .status(404)
        .json({ error: `Recipient of id ${recipient_id} not found.` });
    }

    const deliveryman = await Deliveryman.findOne({
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'deleted_at', 'avatar_id'],
      },
      where: {
        id: deliveryman_id,
        deleted_at: null,
      },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    if (!deliveryman) {
      return res
        .status(404)
        .json({ error: `Deliveryman of id ${deliveryman_id} not found.` });
    }

    const { id, product, start_date, end_date } = await Delivery.create(
      req.body
    );

    const delivery = {
      id,
      product,
      start_date,
      end_date,
      recipient,
      deliveryman,
    };

    /**
     * Quando a encomenda é cadastrada para um entregador, o entregador recebe
     * um e-mail com detalhes da encomenda, com nome do produto e uma mensagem
     * informando-o que o produto já está disponível para a retirada.
     */
    await Queue.add(NewDelivery.key, { delivery });

    return res.status(201).json(delivery);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string(),
      recipient_id: Yup.number()
        .integer()
        .required(),
      deliveryman_id: Yup.number()
        .integer()
        .required(),
      signature_id: Yup.number().integer(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Validation failed.');
    }

    const { id } = req.params;

    const delivery = await Delivery.findOne({
      where: {
        id,
        canceled_at: null,
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
      return res.status(404).json({ error: `Delivery of id ${id} not found.` });
    }

    const {
      recipient_id,
      deliveryman_id,
      signature_id,
      canceled_at,
      start_date,
      end_date,
    } = req.body;

    if (recipient_id && !delivery.recipient_id !== recipient_id) {
      const recipient = await Recipient.findByPk(recipient_id);

      if (!recipient) {
        return res
          .status(404)
          .json({ error: `Recipient of id ${recipient_id} not found.` });
      }
    }

    if (deliveryman_id && !delivery.deliveryman_id !== deliveryman_id) {
      const deliveryman = await Deliveryman.findByPk(deliveryman_id);

      if (!deliveryman) {
        return res
          .status(404)
          .json({ error: `Deliveryman of id ${deliveryman_id} not found.` });
      }
    }

    if (signature_id && !delivery.signature_id !== signature_id) {
      const signature = await File.findByPk(signature_id);

      if (!signature) {
        return res
          .status(404)
          .json({ error: `Signature of id ${signature_id} not found.` });
      }
    }

    if (canceled_at && !delivery.canceled_at !== canceled_at) {
      return res
        .status(404)
        .json({ error: 'The cancellation date cannot be modified.' });
    }

    if (start_date && !delivery.start_date !== start_date) {
      return res
        .status(400)
        .json({ error: 'The start date cannot be modified.' });
    }

    if (end_date && !delivery.end_date !== end_date) {
      return res
        .status(400)
        .json({ error: 'The end date cannot be modified.' });
    }

    await (await delivery.update(req.body)).reload();

    return res.status(200).json(delivery);
  }

  async delete(req, res) {
    const { id } = req.params;

    const delivery = await Recipient.findByPk(id);

    if (!delivery) {
      return res.status(404).json({ error: `Delivery of id ${id} not found.` });
    }

    if (delivery.canceled_at) {
      return res
        .status(404)
        .json({ error: `Delivery of id ${id}, already canceled.` });
    }

    if (delivery.start_date !== null) {
      return res
        .status(404)
        .json({ error: `Delivery of id ${id}, already started.` });
    }

    delivery.canceled_at = new Date();

    await delivery.save();

    return res.status(204).send(`Delivery of id ${id} deleted with success.`);
  }
}

export default new DeliveryController();
