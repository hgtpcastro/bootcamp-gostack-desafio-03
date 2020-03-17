import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  startOfDay,
  endOfDay,
  parseISO,
  isBefore,
  setHours,
  setMinutes,
  setSeconds,
  isWithinInterval,
} from 'date-fns';

import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import Recipient from '../models/Recipient';

class DeliveryStartsController {
  async update(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    const { deliverymanId, deliveryId } = req.params;
    const { start_date } = req.body;

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

    if (delivery.start_date !== null) {
      return res
        .status(400)
        .json({ error: 'You can only withdraw a delivery one time' });
    }

    if (isBefore(start_date, new Date())) {
      return res
        .status(400)
        .json({ error: 'Withdrawal with past dates are not permitted.' });
    }

    const parseStartDate = parseISO(start_date);
    const startDate = setSeconds(setMinutes(setHours(parseStartDate, 8), 0), 0);
    const endDate = setSeconds(setMinutes(setHours(parseStartDate, 18), 0), 0);

    const isBetween = isWithinInterval(parseStartDate, {
      start: startDate,
      end: endDate,
    });

    if (!isBetween) {
      return res.status(400).json({
        error: `Withdrawals can only be made between ${startDate}h and ${endDate}h.`,
      });
    }

    const withdraws = await Delivery.findAll({
      where: {
        deliverymanId,
        canceled_at: null,
        end_date: null,
        start_date: {
          [Op.between]: [startOfDay(startDate), endOfDay(endDate)],
        },
      },
    });

    if (withdraws.length >= 5) {
      return res
        .status(400)
        .json({ error: 'You cannot perform more than 5 withdrawals per day.' });
    }

    delivery.start_date = start_date;

    await delivery.save();

    return res.status(200).json(delivery);
  }
}

export default new DeliveryStartsController();
