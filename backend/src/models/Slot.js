const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Doctor = require('./Doctor');

const Slot = sequelize.define('Slot', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    doctorId: {
        type: DataTypes.INTEGER,
        references: {
            model: Doctor,
            key: 'id',
        },
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    isBooked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    lockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lockedBy: {
        type: DataTypes.INTEGER, // User ID
        allowNull: true,
    },
});

Doctor.hasMany(Slot, { foreignKey: 'doctorId' });
Slot.belongsTo(Doctor, { foreignKey: 'doctorId' });

module.exports = Slot;
