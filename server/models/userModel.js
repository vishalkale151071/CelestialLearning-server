const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "Inactive",
    },
    role: {
      type: String,
      required: true,
    },
  },{
    versionKey:false,
  }
);

//userSchema.p

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.pre('updateOne', async function(next) {
  const salt = await bcrypt.genSalt(10)
  this._update.password = await bcrypt.hash(this._update.password, salt)
 })

const User = mongoose.model('User', userSchema)

module.exports =  User