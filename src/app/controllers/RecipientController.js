import * as Yup from 'yup';

import Recipient from '../models/Recipient';

class RecipientController {
  async index(req, res) {
    const recipients = await Recipient.findAll({
      order: ['id'],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    return res.json(recipients);
  }

  async show(req, res) {
    const recipient_id = req.params.id;

    const recipient = await Recipient.findByPk(recipient_id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    if (!recipient) {
      return res
        .status(400)
        .json({ error: `Recipient of id ${recipient_id} not found.` });
    }

    return res.json(recipient);
  }

  async store(req, res) {
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
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    } = recipient;

    return res.json({
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
    try {
      const { id: recipient_id } = req.params;

      const deleted = await Recipient.destroy({ where: { id: recipient_id } });

      if (deleted) {
        return res.status(204).send('Recipient deleted.');
      }

      throw new Error(`Recipient of id ${recipient_id} not found.`);
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }
}

export default new RecipientController();
