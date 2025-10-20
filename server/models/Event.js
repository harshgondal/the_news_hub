import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['sports', 'general', 'technology', 'business', 'entertainment', 'politics'],
    lowercase: true
  },
  eventType: {
    type: String,
    required: true,
    // Sports: match, tournament, race, etc.
    // General: conference, festival, holiday, etc.
    // Technology: launch, conference, release, etc.
    trim: true
  },
  eventDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  venue: {
    type: String,
    trim: true
  },
  participants: [{
    type: String,
    trim: true
  }],
  // For sports: teams, players
  // For general: speakers, performers
  imageUrl: {
    type: String,
    trim: true
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true
  },
  isLive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: Number,
    default: 0,
    // Higher priority events show first
  }
}, {
  timestamps: true
});

// Index for efficient querying
eventSchema.index({ eventDate: 1, category: 1 });
eventSchema.index({ status: 1, eventDate: 1 });
eventSchema.index({ category: 1, eventDate: 1 });

// Virtual for checking if event is today
eventSchema.virtual('isToday').get(function() {
  const today = new Date();
  const eventDate = new Date(this.eventDate);
  return today.toDateString() === eventDate.toDateString();
});

// Virtual for checking if event is tomorrow
eventSchema.virtual('isTomorrow').get(function() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const eventDate = new Date(this.eventDate);
  return tomorrow.toDateString() === eventDate.toDateString();
});

// Method to check if event is within next N days
eventSchema.methods.isWithinDays = function(days) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.eventDate <= futureDate && this.eventDate >= new Date();
};

// Auto-update status based on dates
eventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDate = new Date(this.eventDate);
  const endDate = this.endDate ? new Date(this.endDate) : eventDate;
  
  if (now < eventDate) {
    this.status = 'upcoming';
  } else if (now >= eventDate && now <= endDate) {
    this.status = 'ongoing';
    this.isLive = true;
  } else if (now > endDate) {
    this.status = 'completed';
    this.isLive = false;
  }
  
  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
