const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  type: { type: String, required: true },
  lead_no: { type: String, required: true },
  subject: { type: String, required: true },
  content: [
    {
      postPic: { type: String, required: true },
      comments: [
        {
          text: { type: String, required: true },
          commentedBy: { type: String, required: true },
        },
      ],
    },
  ],
});

module.exports = mongoose.model('InstagramPost', postSchema);
