const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

  type:{
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  lead_no:{
    type : Number,
  },
  image:{
    type:String
  },
  body: {
    type: String,
    
  },
  date: {
    type: Date,
    default: Date.now,
  },
  key: {
    type: String,
    enum: ['send', 'receive'],
    default: 'receive',
  },
});

module.exports = mongoose.model('Message', messageSchema);
