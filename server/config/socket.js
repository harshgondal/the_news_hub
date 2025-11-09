import { Server } from 'socket.io';

let io = null;

export const initializeSocket = (server) => {
  const allowedOrigins = [
    'http://localhost:5173', // Local development
    process.env.CLIENT_URL, // Production frontend URL
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join room for a specific article
    socket.on('join-article', (articleId) => {
      socket.join(`article-${articleId}`);
      console.log(`📰 Client ${socket.id} joined article room: article-${articleId}`);
    });

    // Leave room for a specific article
    socket.on('leave-article', (articleId) => {
      socket.leave(`article-${articleId}`);
      console.log(`📰 Client ${socket.id} left article room: article-${articleId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};


