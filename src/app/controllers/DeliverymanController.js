import * as Yup from 'yup';
import { Op } from 'sequelize';

import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliverymanController {
  async index(req, res) {
    const { page = 1, q } = req.query;
    let whereObject = { deleted_at: null };

    if (q) {
      whereObject = {
        name: { [Op.like]: `%${q}%` },
        deleted_at: null,
      };
    }

    const deliverymen = await Deliveryman.findAll({
      where: whereObject,
      order: ['id'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'deleted_at', 'avatar_id'],
      },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    return res.json(deliverymen);
  }

  async show(req, res) {
    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id, {
      attributes: { exclude: ['createdAt', 'updatedAt', 'avatar_id'] },
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
        .status(400)
        .json({ error: `Deliveryman of id ${id} not found.` });
    }

    if (deliveryman.deleted_at) {
      return res
        .status(400)
        .json({ error: `Deliveryman of id ${id} deleted.` });
    }

    const { name, email, avatar } = deliveryman;

    return res.json({
      id,
      name,
      email,
      avatar,
    });
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string()
        .required()
        .strict(),
      email: Yup.string()
        .email()
        .required(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Validation failed.');
    }

    const deliverymanExists = await Deliveryman.findOne({
      where: {
        email: req.body.email,
      },
      attributes: ['id'],
    });

    if (deliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman already exists.' });
    }

    const { id, name, email, avatar_id } = await Deliveryman.create(req.body);

    return res.json({
      id,
      name,
      email,
      avatar_id,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().strict(),
      email: Yup.string().email(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Validation failed.');
    }

    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
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
        .status(400)
        .json({ error: `Deliveryman of id ${id} not found.` });
    }

    if (deliveryman.deleted_at) {
      return res
        .status(400)
        .json({ error: `Deliveryman of id ${id} deleted.` });
    }

    const { email } = req.body;

    if (email && email !== deliveryman.email) {
      const emailExists = await Deliveryman.findOne({ where: { email } });

      if (emailExists) {
        return res.status(401).json({ error: 'Email already exists.' });
      }
    }

    const { name, avatar_id } = await deliveryman.update(req.body);

    return res.json({
      id,
      name,
      email,
      avatar_id,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id);

    if (!deliveryman) {
      return res
        .status(400)
        .json({ error: `Deliveryman of id ${id} not found.` });
    }

    if (deliveryman.deleted_at) {
      return res
        .status(400)
        .json({ error: `Deliveryman of id ${id}, already deleted.` });
    }

    deliveryman.deleted_at = new Date();

    await deliveryman.save();

    return res
      .status(204)
      .send(`Deliveryman of id ${id} deleted with success.`);
  }
}

export default new DeliverymanController();
