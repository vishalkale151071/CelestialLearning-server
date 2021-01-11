const mongoose = require('mongoose');
const slug = require('slug')
const videoSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    videoSlug: {
        type: String
    }
});

videoSchema.pre('save' | 'update', async () => {
    this.videoSlug = slug(this.name);
});

const Video = new mongoose.model('Video', videoSchema)

const sectionSchema = mongoose.Schema({
    number: {
        type: Number,
        required: true
    },
    sectionName: {
        type: String,
        required: true
    },
    video: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
    sectionSlug: {
        type: String
    }

});

sectionSchema.pre('save', async function (next) {
    this.sectionSlug = slug(this.sectionName);
    //const content = new Content();
    //content.save();
    next();
});

const Section = new mongoose.model('Section', sectionSchema)

const contentSchema = mongoose.Schema(
    {
        section: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Section'
        }]
    }
);

const Content = new mongoose.model('Content', contentSchema);

const courseSchema = mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Author'
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        suitableFor: [{
            type: String
        }],
        platform: {
            type: String
        },
        prerequisite: {
            type: String
        },
        courseSlug: {
            type: String
        },
        content: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Content'
        }
    }
);

courseSchema.pre('save', async function (next) {
    this.courseSlug = slug(this.title);
    next();
});

const Course = new mongoose.model('Course', courseSchema);

module.exports = {
    Course: Course,
    Content: Content,
    Section: Section,
    Video: Video
}
