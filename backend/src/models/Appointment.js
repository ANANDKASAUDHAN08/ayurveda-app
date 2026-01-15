const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const User = require('./User');
const Doctor = require('./Doctor');
const Slot = require('./Slot');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id',
        },
    },
    doctorId: {
        type: DataTypes.INTEGER,
        references: {
            model: Doctor,
            key: 'id',
        },
    },
    slotId: {
        type: DataTypes.INTEGER,
        references: {
            model: Slot,
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM('booked', 'completed', 'cancelled'),
        defaultValue: 'booked',
    },
    type: {
        type: DataTypes.ENUM('online', 'in-person'),
        allowNull: false,
    },
});

User.hasMany(Appointment, { foreignKey: 'userId' });
Appointment.belongsTo(User, { foreignKey: 'userId' });

Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });

Slot.hasOne(Appointment, { foreignKey: 'slotId' });
Appointment.belongsTo(Slot, { foreignKey: 'slotId' });

module.exports = Appointment;
