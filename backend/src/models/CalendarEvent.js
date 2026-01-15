const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const User = require('./User');

const CalendarEvent = sequelize.define('CalendarEvent', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
    },
    type: {
        type: DataTypes.ENUM('appointment', 'order', 'ritual', 'medication', 'activity', 'vital', 'weather_alert'),
        allowNull: false,
    },
    sub_type: {
        type: DataTypes.ENUM('ayurveda', 'allopathy', 'general'),
        defaultValue: 'general',
    },
    category: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.ENUM('planned', 'completed', 'skipped', 'active'),
        defaultValue: 'planned',
    },
    value: {
        type: DataTypes.STRING,
    },
    unit: {
        type: DataTypes.STRING,
    },
    is_system_generated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    intensity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 5 }
    },
    medication_info: {
        type: DataTypes.JSON,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
    },
}, {
    tableName: 'calendar_events',
    timestamps: true,
});

User.hasMany(CalendarEvent, { foreignKey: 'userId' });
CalendarEvent.belongsTo(User, { foreignKey: 'userId' });

module.exports = CalendarEvent;
