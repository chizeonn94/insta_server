const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const NotificationSchema = new mongoose.Schema({
  sender: { type: ObjectId, ref: "User" },
  receiver: { type: ObjectId, ref: "User" },
  notificationType: {
    type: String,
    enum: ["follow", "like", "comment", "mention"],
  },
  date: Date,
  notificationData: Object,
  read: { type: Boolean, default: false },
});

const Notification = mongoose.model("notification", NotificationSchema);
module.exports = Notification;
