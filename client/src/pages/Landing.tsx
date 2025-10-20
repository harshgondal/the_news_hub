import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Newspaper, 
  Zap, 
  MessageSquare, 
  Shield,
  Brain,
  Sun,
  Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDark, setIsDark] = useState(true);

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'Deep AI Analysis',
      description: 'Every article analyzed with AI for deeper insights and comprehensive understanding.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Verified Sources',
      description: 'Updates from trusted global newspapers and magazines you can rely on.',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Stay in sync with breaking headlines as they happen.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: MessageSquare,
      title: 'Community Discussions',
      description: 'Join topic-based conversations and share your perspectives.',
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className={`min-h-screen overflow-hidden relative transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50 text-gray-900'
    }`}>
      {/* Animated background gradient */}
      <div 
        className={`absolute inset-0 ${isDark ? 'opacity-30' : 'opacity-20'}`}
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, ${isDark ? '0.15' : '0.25'}), transparent 50%)`
        }}
      />

      {/* Grid pattern overlay */}
      <div className={`absolute inset-0 bg-[linear-gradient(${isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)'}_1px,transparent_1px),linear-gradient(90deg,${isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)'}_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]`} />

      {/* Floating orbs */}
      <div className={`absolute top-20 left-20 w-72 h-72 ${isDark ? 'bg-blue-500/20' : 'bg-blue-400/30'} rounded-full blur-3xl animate-pulse`} />
      <div className={`absolute bottom-20 right-20 w-96 h-96 ${isDark ? 'bg-violet-500/20' : 'bg-violet-400/30'} rounded-full blur-3xl animate-pulse delay-1000`} />

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Newspaper className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            News Aggregator
          </span>
        </div>
        
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDark(!isDark)}
          className={`p-3 rounded-lg transition-all ${
            isDark 
              ? 'bg-white/10 hover:bg-white/20 text-yellow-400' 
              : 'bg-gray-900/10 hover:bg-gray-900/20 text-gray-900'
          }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-sm rounded-full mb-6 ${
              isDark 
                ? 'bg-white/5 border border-white/10' 
                : 'bg-white/50 border border-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              News with Deep AI Analysis & Discussions
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold mb-5 leading-tight"
          >
            Stay Ahead with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Global News
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`text-base mb-8 max-w-2xl mx-auto leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Get AI-analyzed news updates from top global sources with in-depth insights and community discussions.
            Never miss what matters to you.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/signup')}
              className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg hover:from-blue-500 hover:to-violet-500 transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-2 font-semibold text-white"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className={`px-8 py-3 backdrop-blur-sm rounded-lg transition-all font-semibold ${
                isDark 
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white' 
                  : 'bg-gray-900/5 border border-gray-300 hover:bg-gray-900/10 text-gray-900'
              }`}
            >
              Login
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Powerful Features
          </h2>
          <p className={`text-sm max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Experience news like never before with our intelligent platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`group relative p-6 backdrop-blur-sm rounded-2xl transition-all cursor-pointer ${
                isDark 
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/50' 
                  : 'bg-white/50 border border-gray-200 hover:bg-white/70 hover:border-violet-400/50'
              }`}
            >
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity blur-xl`} />
              
              <div className="relative">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Transform Your News Experience?
          </h2>
          <p className={`text-lg mb-8 max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Join thousands of readers who stay informed with AI-powered deep analysis
          </p>
        </motion.div>
      </div>

    </div>
  );
};

export default Landing;
