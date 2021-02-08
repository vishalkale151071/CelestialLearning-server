const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriberProfile = mongoose.Schema(
  {
    firstName: {
      type: String,
      default: "NA",
    },
    middleName: {
      type: String,
      default: "NA",
    },
    lastName: {
      type: String,
      default: "NA",
    },
    phNum: {
      type: String,
      default: "NA",
    },
    linkedInURL: {
      type: String,
      default: "NA",
    },
    twitterURL: {
      type: String,
      default: "NA",
    },
    higherEducation: {
      type: String,
      default: "NA",
    },
    areaOfInterest: {
      type: String,
      default: "NA",
    },
    extension: {
      type: String,
      default: "NA",
    }
  }, {
  versionKey: false,
}
);
const SubscriberProfile = new mongoose.model('SubscriberProfile', subscriberProfile)

const orderSchema = mongoose.Schema(
  {
    
    courseId: [{
      type: String,
      required: true,
      
    }],
    paymentId: {
      type: String,
      default: "NA",
      
    },
    status: {
      type: String,
      default:"Incomplete"
    },
    price: [{
      type: Number,
      required:true
    }],
    subscriberId : {
      type: String,
    }
  }, {
  versionKey: false,
}
);

const Order = new mongoose.model('Order', orderSchema);

const subscribedCoursesSchema = mongoose.Schema(
  {
      courseId : [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course'
      }]
  }, {
  versionKey: false,
}
);

const SubscribedCourses = new mongoose.model('SubscribedCourses', subscribedCoursesSchema);

const subscriberSchema = mongoose.Schema(
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

      default: "Inactive",
    },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriberProfile"
    },
    subscribedCourses: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscribedCourses',
  } 
  }, {
  versionKey: false,
}
);





subscriberSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

subscriberSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  const profile = new SubscriberProfile();
  profile.save();
  this.profile_id = profile._id;
  // const subscribedCourses = new SubscribedCourses();
  // subscribedCourses.save();
  // this.subscribedCourses = subscribedCourses._id;
})

subscriberSchema.pre('updateOne', async function (next) {
  const salt = await bcrypt.genSalt(10)
  this._update.password = await bcrypt.hash(this._update.password, salt)
})

const Subscriber = new mongoose.model('Subscriber', subscriberSchema)


module.exports = { Subscriber: Subscriber, SubscriberProfile: SubscriberProfile, SubscribedCourses: SubscribedCourses, Order:Order}

