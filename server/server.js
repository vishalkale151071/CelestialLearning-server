const express = require('express');
const cors = require('cors');
const colors = require('colors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const subscriberRoutes = require('./routes/subscriberRoutes');
const authorRoutes = require('./routes/authorRoutes');
const pluginRoutes = require('./routes/pluginRoutes');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const { param } = require('./routes/authorRoutes');
const { logout } = require('./controller/logout');
const homeRoutes = require('./routes/homeRoutes');
const courseRoutes = require('./routes/courseRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const progressRoutes = require('./routes/progressRoutes')
const assessmentRoutes = require('./routes/assessmentRoutes')
connectDB();

const app = express();
dotenv.config();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())

app.use(session({
    secret: "12345",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        clear_interval: 3600
    })
}));

console.log(`${__dirname}`)
app.get('/favicon.ico', async (req, res) => {
    res.status(200);
    res.sendFile(`${__dirname}/CL.png`);
});

app.get('/logo192.png', async (req, res) => {
    res.status(200);
    res.sendFile(`${__dirname}/CL.png`);
});
app.use('/api/subscriber', subscriberRoutes);
app.use('/api/author', authorRoutes);
app.use('/api/plugin', pluginRoutes);
app.use('/api/home',homeRoutes);
app.use('/api/course',courseRoutes);
app.use('/api/payment',paymentRoutes);
app.post('/api/logout', logout);




if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(notFound)
app.use(errorHandler)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
