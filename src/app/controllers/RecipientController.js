import * as Yup from 'yup';

import Recipient from '../models/Recipient';
import User from '../models/User';

class RecipientController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const recipients = await Recipient.findAll({
      where: { deleted_at: null },
      order: ['id'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: { exclude: ['createdAt', 'updatedAt', 'deleted_at'] },
    });

    return res.json(recipients);
  }

  async show(req, res) {
    const recipient_id = req.params.id;

    const recipient = await Recipient.findByPk(recipient_id);

    if (!recipient) {
      return res
        .status(400)
        .json({ error: `Recipient of id ${recipient_id} not found.` });
    }

    if (recipient.deleted_at) {
      return res
        .status(400)
        .json({ error: `Recipient of id ${recipient_id} deleted.` });
    }

    const {
      id,
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    } = recipient;

    return res.json({
      id,
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    });
  }

  async store(req, res) {
    if (!(await User.isAdministrator(req.userId))) {
      return res
        .status(401)
        .json({ error: 'User is not allowed to access this resource.' });
    }

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string().required(),
      number: Yup.string().required(),
      complement: Yup.string(),
      state: Yup.string()
        .required()
        .strict(true)
        .max(2),
      city: Yup.string().required(),
      zip_code: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Validation fails.');
    }

    const recipient = await Recipient.create(req.body);

    const {
      id,
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    } = recipient;

    return res.json({
      id,
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    });
  }

  async update(req, res) {
    if (!(await User.isAdministrator(req.userId))) {
      return res
        .status(401)
        .json({ error: 'User is not allowed to access this resource.' });
    }

    const schema = Yup.object().shape({
      name: Yup.string(),
      street: Yup.string(),
      number: Yup.string(),
      complement: Yup.string(),
      state: Yup.string()
        .strict(true)
        .max(2),
      city: Yup.string(),
      zip_code: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Validation fails.');
    }

    const { id: recipient_id } = req.params;

    const recipient = await Recipient.findByPk(recipient_id);

    if (!recipient) {
      return res
        .status(400)
        .json({ error: `Recipient of id ${recipient_id} not found.` });
    }

    if (recipient.deleted_at) {
      return res
        .status(400)
        .json({ error: `Recipient of id ${recipient_id} deleted.` });
    }

    const {
      id,
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    } = await recipient.update(req.body);

    return res.json({
      id,
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    });
  }

  async delete(req, res) {
    const { id: recipient_id } = req.params;

    if (!(await User.isAdministrator(req.userId))) {
      return res
        .status(401)
        .json({ error: 'User is not allowed to access this resource.' });
    }

    const recipient = await Recipient.findByPk(recipient_id);

    if (!recipient) {
      return res
        .status(400)
        .json({ error: `Recipient of id ${recipient_id} not found.` });
    }

    if (recipient.deleted_at) {
      return res
        .status(400)
        .json({ error: `Recipient of id ${recipient_id} deleted.` });
    }

    recipient.deleted_at = new Date();

    await recipient.save();

    return res
      .status(204)
      .send(`Recipient of id ${recipient_id} deleted with success.`);
  }
}

export default new RecipientController();
