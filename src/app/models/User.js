import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        administrator: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );

    this.addHook('beforeSave', async user => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this;
  }

  checkEmail(email) {
    return email === this.email;
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  static async isAdministrator(user_id) {
    const user = await this.findOne({
      where: { id: user_id, administrator: true },
      attributes: ['administrator'],
    });

    return !!user;
  }
}

export default User;
