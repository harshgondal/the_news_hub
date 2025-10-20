import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, RefreshCw, ArrowRight, Clock, MapPin, Users, Radio } from 'lucide-react';
import { Event } from '../types';
import api from '../api/axios';
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

type Category = 'all' | 'sports' | 'general' | 'technology' | 'business' | 'entertainment' | 'politics';
type TimeFilter = 'today' | 'tomorrow' | 'others' | 'completed';

const UpcomingEvents: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  useEffect(() => {
    fetchEvents();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchEvents(true);
    }, 300000);

    return () => clearInterval(interval);
  }, [selectedCategory, timeFilter]);

  const fetchEvents = async (isAutoRefresh = false) => {
    try {
      setLoading(true);
      
      let endpoint = '/events/upcoming';
      const params: any = { limit: 50 };
      
      // Set endpoint based on time filter
      if (timeFilter === 'today') {
        endpoint = '/events/today';
      } else if (timeFilter === 'tomorrow') {
        endpoint = '/events/tomorrow';
      } else if (timeFilter === 'completed') {
        endpoint = '/events/completed';
      } else {
        // Others - show next 30 days
        params.days = 30;
      }
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      const response = await api.get(endpoint, { params });
      
      if (response.data.success) {
        const newEvents = response.data.data;
        
        // Check if there are new events
        if (isAutoRefresh && events.length > 0) {
          const hasNew = newEvents.some(
            (event: Event) => !events.find(e => e._id === event._id)
          );
          if (hasNew) {
            setHasNewUpdates(true);
          }
        }
        
        setEvents(newEvents);
        setLastFetchTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setHasNewUpdates(false);
    fetchEvents();
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewUpdates(false);
  };

  const handleEventClick = (event: Event) => {
    if (event.sourceUrl) {
      window.open(event.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sports: 'bg-orange-500',
      general: 'bg-blue-500',
      technology: 'bg-purple-500',
      business: 'bg-green-500',
      entertainment: 'bg-pink-500',
      politics: 'bg-red-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getEventTypeIcon = (category: string) => {
    const icons: Record<string, string> = {
      sports: '⚽',
      general: '📅',
      technology: '💻',
      business: '💼',
      entertainment: '🎬',
      politics: '🏛️'
    };
    return icons[category] || '📌';
  };

  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM dd, h:mm a');
    }
  };

  const categories: { value: Category; label: string; emoji: string }[] = [
    { value: 'all', label: 'All', emoji: '🌐' },
    { value: 'sports', label: 'Sports', emoji: '⚽' },
    { value: 'general', label: 'General', emoji: '📰' },
    { value: 'technology', label: 'Tech', emoji: '💻' },
    { value: 'business', label: 'Business', emoji: '💼' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { value: 'politics', label: 'Politics', emoji: '🏛️' }
  ];

  // Generate time filter labels with dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const next30Days = new Date(today);
  next30Days.setDate(next30Days.getDate() + 30);

  const timeFilters: { value: TimeFilter; label: string; dateLabel: string }[] = [
    { 
      value: 'today', 
      label: 'Today',
      dateLabel: format(today, 'MMM dd')
    },
    { 
      value: 'tomorrow', 
      label: 'Tomorrow',
      dateLabel: format(tomorrow, 'MMM dd')
    },
    { 
      value: 'others', 
      label: 'Others',
      dateLabel: `Next 30 days`
    },
    { 
      value: 'completed', 
      label: 'Completed',
      dateLabel: `Recent`
    }
  ];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all group ${
          hasNewUpdates ? 'animate-pulse ring-2 ring-purple-500/50' : ''
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Calendar className="h-7 w-7 group-hover:rotate-12 transition-transform" />
        {hasNewUpdates && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          />
        )}
      </motion.button>

      {/* Upcoming Events Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Popup Card */}
            <motion.div
              className="fixed bottom-6 right-6 w-[450px] max-w-[calc(100vw-48px)] max-h-[650px] bg-[#1e293b]/95 backdrop-blur-lg rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-700"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-yellow-300" />
                    <h3 className="text-lg font-bold text-white">Upcoming Events</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleManualRefresh}
                      disabled={loading}
                      className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                      title="Refresh events"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-center space-x-2 text-white/70 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>
                    Updated {formatDistanceToNow(lastFetchTime, { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Time Filter Tabs */}
              <div className="flex items-center space-x-2 p-3 bg-slate-900/50 border-b border-slate-700">
                {timeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setTimeFilter(filter.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center ${
                      timeFilter === filter.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="font-semibold">{filter.label}</span>
                    <span className={`text-[10px] mt-0.5 ${
                      timeFilter === filter.value ? 'text-purple-200' : 'text-slate-400'
                    }`}>
                      {filter.dateLabel}
                    </span>
                  </button>
                ))}
              </div>

              {/* Category Tabs */}
              <div className="flex items-center space-x-2 p-3 bg-slate-900/50 overflow-x-auto custom-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="mr-1">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Events List */}
              <div className="p-4 max-h-[380px] overflow-y-auto space-y-3 custom-scrollbar">
                {loading && events.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No upcoming events</p>
                    <p className="text-slate-500 text-xs mt-1">Check back later for updates</p>
                  </div>
                ) : (
                  events.map((event, index) => (
                    <motion.div
                      key={event._id}
                      className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-purple-500/50 hover:bg-slate-700/70 transition-all cursor-pointer group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        {/* Category Badge & Live Indicator */}
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white ${getCategoryColor(event.category)}`}>
                            {event.category.toUpperCase()}
                          </span>
                          {event.isLive && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-semibold animate-pulse">
                              <Radio className="h-2.5 w-2.5" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <span className="text-2xl">{getEventTypeIcon(event.category)}</span>
                      </div>

                      {/* Title */}
                      <h4 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {event.title}
                      </h4>

                      {/* Description */}
                      {event.description && (
                        <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Event Details */}
                      <div className="space-y-1 mb-2">
                        {/* Date & Time */}
                        <div className="flex items-center space-x-2 text-xs text-slate-300">
                          <Clock className="h-3 w-3 text-purple-400" />
                          <span>{formatEventDate(event.eventDate)}</span>
                        </div>

                        {/* Location */}
                        {(event.location || event.venue) && (
                          <div className="flex items-center space-x-2 text-xs text-slate-300">
                            <MapPin className="h-3 w-3 text-purple-400" />
                            <span className="line-clamp-1">
                              {event.venue || event.location}
                            </span>
                          </div>
                        )}

                        {/* Participants */}
                        {event.participants && event.participants.length > 0 && (
                          <div className="flex items-center space-x-2 text-xs text-slate-300">
                            <Users className="h-3 w-3 text-purple-400" />
                            <span className="line-clamp-1">
                              {event.participants.slice(0, 2).join(' vs ')}
                              {event.participants.length > 2 && ` +${event.participants.length - 2}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-600">
                        <div className="flex items-center space-x-2">
                          {event.source && <span className="font-medium">{event.source}</span>}
                          <span className="px-2 py-0.5 bg-slate-600 rounded text-[10px]">
                            {event.eventType}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-900/50 border-t border-slate-700 text-center">
                <p className="text-slate-400 text-xs">
                  Auto-refreshes every 5 minutes • {events.length} event{events.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </>
  );
};

export default UpcomingEvents;
