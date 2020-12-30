const mongoose = require('mongoose');

const connectDB = async () => {
    try {
          const conn = await mongoose.connect(
            'mongodb+srv://rootuser:root@crud.pvs1y.mongodb.net/test?authSource=admin&replicaSet=atlas-z3st35-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true',
            {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                useCreateIndex: true
            }
        );

        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.underline.bold);
        process.exit(1);
    }
};

module.exports = connectDB;
