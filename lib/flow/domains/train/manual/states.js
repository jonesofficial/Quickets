const TRAIN_MANUAL_STATES = {
  INIT: "TRAIN_MANUAL_INIT",

  // Admin selected booking for processing
  PROCESSING: "TRAIN_MANUAL_PROCESSING",

  // Admin sends AVAILABLE / WL / RAC / NO_CHANCE
  AWAITING_AVAILABILITY_DECISION: "TRAIN_MANUAL_AWAITING_AVAILABILITY_DECISION",

  // User chose to proceed after seeing status
  USER_ACCEPTED_STATUS: "TRAIN_MANUAL_USER_ACCEPTED_STATUS",

  // User cancelled after seeing status
  USER_REJECTED_STATUS: "TRAIN_MANUAL_USER_REJECTED_STATUS",

  // Admin must now send fare
  AWAITING_FARE_INPUT: "TRAIN_MANUAL_AWAITING_FARE_INPUT",

  // Fare sent to user
  FARE_SENT: "TRAIN_MANUAL_FARE_SENT",

  // Waiting for payment
  PAYMENT_PENDING: "TRAIN_MANUAL_PAYMENT_PENDING",

  // Payment received
  PAYMENT_SUCCESS: "TRAIN_MANUAL_PAYMENT_SUCCESS",

  // Ticket confirmed
  CONFIRMED: "TRAIN_MANUAL_CONFIRMED",

  // Cancelled by user
  CANCELLED: "TRAIN_MANUAL_CANCELLED",

  // Train has no confirmation chance
  NO_CHANCE: "TRAIN_MANUAL_NO_CHANCE",
};

module.exports = TRAIN_MANUAL_STATES;