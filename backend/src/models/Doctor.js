const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Doctor = sequelize.define('Doctor', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    specialization: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    mode: {
        type: DataTypes.ENUM('online', 'in-person', 'both'),
        defaultValue: 'both',
    },
    experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Changed to true to allow standalone doctor records
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    about: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    qualifications: {
        type: DataTypes.STRING, // Storing as comma-separated string or JSON string
        allowNull: true
    },
    consultationFee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 500
    },
    languages: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'English, Hindi'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

// Define association
const User = require('./User');
Doctor.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Doctor, { foreignKey: 'userId' });

module.exports = Doctor;
