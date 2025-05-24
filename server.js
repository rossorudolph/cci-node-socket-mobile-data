// Oscilloscope Creatures Server
// Handles mobile clients and shared view connections

let express = require('express');
let app = express();
let port = Number(process.env.PORT || 3000);
let server = app.listen(port);

// Serve static files
app.use(express.static('public'));

// Add CSP headers for font loading and other resources
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' data: https://cdnjs.cloudflare.com; " +
    "connect-src 'self' ws: wss:; " +
    "img-src 'self' data:;"
  );
  next();
});

console.log("Oscilloscope Creatures server running on port " + port);

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Oscilloscope Creatures</title>
        <style>
            body {
                margin: 0;
                padding: 40px;
                background: #000;
                color: #fff;
                font-family: 'Courier New', monospace;
                text-align: center;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
            }
            h1 {
                color: #00ff00;
                font-size: 48px;
                margin-bottom: 20px;
            }
            .option {
                background: #333;
                margin: 20px 0;
                padding: 30px;
                border-radius: 10px;
                border: 2px solid #666;
            }
            .option h2 {
                color: #00ccff;
                margin-top: 0;
            }
            .option p {
                color: #ccc;
                margin: 15px 0;
            }
            .button {
                display: inline-block;
                background: #4CAF50;
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 5px;
                font-size: 18px;
                font-weight: bold;
                margin: 10px;
            }
            .button:hover {
                background: #45a049;
            }
            .button.mobile {
                background: #2196F3;
            }
            .button.mobile:hover {
                background: #1976D2;
            }
            .status {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0,255,0,0.2);
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="status">Server Online</div>
        <div class="container">
            <h1>OSCILLOSCOPE<br>CREATURES</h1>
            
            <div class="option">
                <h2>🖥️ SHARED DISPLAY</h2>
                <p>For the main screen, TV, or projector</p>
                <p>Shows all creatures controlled by mobile players</p>
                <a href="/shared" class="button">OPEN DISPLAY</a>
            </div>
            
            <div class="option">
                <h2>📱 MOBILE CONTROLLER</h2>
                <p>For phones and tablets</p>
                <p>Control your oscilloscope creature</p>
                <a href="/mobile" class="button mobile">JOIN GAME</a>
            </div>
            
            <div class="option">
                <h2>ℹ️ HOW TO PLAY</h2>
                <p>• Open SHARED DISPLAY on main screen</p>
                <p>• Players join with MOBILE CONTROLLER</p>
                <p>• Use joystick to move your creature</p>
                <p>• Shake phone to make it grow bigger</p>
                <p>• Tilt device for visual effects</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Redirect routes for easier access
app.get('/shared', (req, res) => {
  res.redirect('/sharedView.html');
});

app.get('/mobile', (req, res) => {
  res.redirect('/client.html');
});

app.get('/display', (req, res) => {
  res.redirect('/sharedView.html');
});

app.get('/controller', (req, res) => {
  res.redirect('/client.html');
});

// Start socket.io with CORS configuration
let socket = require('socket.io');
let io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Game state
let connectedClients = new Map();
let sharedViewSockets = new Set();

// Client namespace - for mobile devices
const clientNamespace = io.of('/client');
clientNamespace.on('connection', (socket) => {
  console.log('\nMobile client connected:', socket.id);
  
  // Notify shared views that a new user joined
  io.of('/sharedView').emit('userJoined', { id: socket.id });
  
  // Handle client updates (sensor data, joystick, etc.)
  socket.on('update', (data) => {
    try {
      const parsedData = JSON.parse(data);
      
      // Store client data
      connectedClients.set(socket.id, {
        ...parsedData,
        lastUpdate: Date.now()
      });
      
      // Forward to all shared views
      io.of('/sharedView').emit('userUpdate', data);
      
    } catch (error) {
      console.error('Error parsing client data:', error);
    }
  });
  
  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Mobile client disconnected:', socket.id);
    connectedClients.delete(socket.id);
    
    // Notify shared views
    io.of('/sharedView').emit('userLeft', { id: socket.id });
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Client socket error:', socket.id, error);
  });
});

// SharedView namespace - for display screens
const sharedViewNamespace = io.of('/sharedView');
sharedViewNamespace.on('connection', (socket) => {
  console.log('\nShared view connected:', socket.id);
  sharedViewSockets.add(socket);
  
  // Send current clients to new shared view
  connectedClients.forEach((clientData, clientId) => {
    socket.emit('userJoined', { id: clientId });
    socket.emit('userUpdate', JSON.stringify(clientData));
  });
  
  // Handle shared view disconnect
  socket.on('disconnect', () => {
    console.log('Shared view disconnected:', socket.id);
    sharedViewSockets.delete(socket);
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('SharedView socket error:', socket.id, error);
  });
});

// Default namespace connection handler (for backward compatibility)
io.on('connection', (socket) => {
  console.log('Default namespace connection:', socket.id);
  
  // Inform client of connection
  socket.emit('id', socket.id);
  
  // Handle legacy join requests (for backward compatibility with your original code)
  socket.on('join', (data) => {
    console.log('Legacy join request:', data);
    
    if (data.name === 'client') {
      // Redirect to client namespace
      socket.emit('redirect', '/client');
    } else if (data.name === 'host') {
      // Redirect to sharedView namespace  
      socket.emit('redirect', '/sharedView');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Default namespace disconnect:', socket.id);
  });
});

// Cleanup inactive clients periodically
setInterval(() => {
  const now = Date.now();
  const timeout = 30000; // 30 seconds
  
  connectedClients.forEach((clientData, clientId) => {
    if (now - clientData.lastUpdate > timeout) {
      console.log('Removing inactive client:', clientId);
      connectedClients.delete(clientId);
      io.of('/sharedView').emit('userLeft', { id: clientId });
    }
  });
}, 10000); // Check every 10 seconds

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    connectedClients: connectedClients.size,
    sharedViews: sharedViewSockets.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('\n=== Oscilloscope Creatures Server ===');
console.log('🌐 Main page: http://localhost:' + port);
console.log('🖥️  Shared display: http://localhost:' + port + '/shared');
console.log('📱 Mobile controller: http://localhost:' + port + '/mobile');
console.log('📊 Status endpoint: /status');
console.log('💚 Health check: /health');
console.log('=====================================\n');