// This is a temporary file with CORS fixes to try

// Change 1: For Express CORS, add this to your server.js file
// Replace your current CORS configuration with:

// CORS configuration - TEMPORARY FIX
app.use(cors({
  origin: '*', // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Change 2: For Socket.IO CORS, add this to your server.js file
// Replace your current Socket.IO initialization with:

const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins temporarily
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

/*
 * IMPORTANT NOTE: Using '*' for CORS origin is NOT secure and should 
 * only be used temporarily for debugging. After confirming this works,
 * replace '*' with the specific frontend domains that should access your API.
 */
