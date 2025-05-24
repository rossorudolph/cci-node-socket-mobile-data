# Oscilloscope Creatures 🌟

A multiplayer game where players control radial oscilloscope creatures using their mobile devices as controllers. Each creature is a living data visualization that responds to device movement, joystick input, and shake gestures.

## 🎮 How It Works

- **Mobile Controller**: Players connect with their phones, using the joystick to move their creature and shaking to make it grow
- **Shared Display**: A central screen shows all creatures interacting in real-time
- **Live Data**: Creatures respond to accelerometer data, creating organic, ever-changing oscilloscope patterns

## 📱 Features

- **Device Motion Controls**: Accelerometer and gyroscope data influence creature behavior
- **Shake Detection**: Shake your phone to make your creature temporarily grow larger  
- **Virtual Joystick**: On-screen joystick for precise movement control
- **Real-time Multiplayer**: Multiple players can join simultaneously
- **Unique Personalities**: Each creature has randomized oscilloscope patterns and colors

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
- **Shared Display**: Visit `http://localhost:3000/sharedView.html` (for the main screen)
- **Mobile Controllers**: Visit `http://localhost:3000/client.html` on mobile devices

## 📁 Project Structure

```
oscilloscope-creatures/
├── server.js              # Socket.IO server with namespaces
├── package.json           # Project dependencies
├── public/
│   ├── client.html        # Mobile controller interface
│   └── sharedView.html    # Shared display screen
└── README.md             # This file
```

## 🎯 Usage

### For the Shared Display (TV/Projector)
1. Open `http://localhost:3000/sharedView.html` in a browser
2. This shows all connected creatures in real-time
3. Press 'D' for debug info, 'R' to reset positions

### For Mobile Players
1. Connect mobile device to same WiFi network
2. Open `http://localhost:3000/client.html` on mobile browser
3. Allow sensor permissions when prompted
4. Use joystick to move, shake phone to grow your creature

## 🔧 Technical Details

### Server Architecture
- **Express.js** serves static files
- **Socket.IO** handles real-time communication
- **Namespaces**: `/client` for mobile devices, `/sharedView` for display screens

### Mobile Controller Features
- Device motion API for accelerometer/gyroscope data
- Touch-based virtual joystick
- Shake detection with configurable threshold
- Automatic reconnection handling

### Oscilloscope Visualization
- 8 radial arms per creature with 30 segments each
- Multiple frequency components create complex patterns
- Device rotation influences wave patterns
- Accelerometer data adds chaos/organic movement
- Each creature has unique personality traits

## 🎨 Customization

### Adding New Colors
Edit the `creatureColors` array in both client files:
```javascript
const creatureColors = [
  "crimson", "gold", "lime", "cyan", "magenta", 
  // Add your colors here
];
```

### Adjusting Sensitivity
Modify these values in the client code:
```javascript
const shakeThreshold = 20;     // Shake detection sensitivity
const updateRate = 15;         // Data transmission rate (fps)
```

### Creature Behavior
Adjust oscilloscope parameters in the shared view:
```javascript
// In createCreature function
personality: {
  freq1: 0.5 + random(2),      // Primary frequency
  freq2: 0.3 + random(1.5),    // Secondary frequency  
  chaos: 0.2 + random(0.5),    // Randomness factor
  speed: 0.8 + random(0.4)     // Animation speed
}
```

## 🌐 Deployment

### Local Network
- Start server: `npm start`
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Players connect to: `http://YOUR_IP:3000/client.html`

### Cloud Deployment (Heroku, Railway, etc.)
1. Set `PORT` environment variable
2. Ensure CORS settings match your domain
3. Update Socket.IO connection URLs in client files

## 🐛 Troubleshooting

### Connection Issues
- Ensure all devices are on same network
- Check firewall settings (port 3000)
- Try different browsers if sensors don't work

### Mobile Permissions
- iOS: Requires HTTPS for DeviceMotion API in production
- Android: Usually works over HTTP on local network
- Clear browser cache if permissions seem stuck

### Performance
- Reduce `updateRate` if lag occurs
- Lower `segments` count in creatures for slower devices
- Use fewer `arms` per creature if needed

## 🎮 Game Tips

- **Smooth Movement**: Gentle joystick movements create fluid motion
- **Shake Strategy**: Time your shakes - there's a 1-second cooldown
- **Tilt Effects**: Small device tilts create subtle pattern changes
- **Exploration**: Try different movement patterns to see how creatures respond

## 📝 License

MIT License - feel free to modify and share!

---

**Enjoy creating digital creatures together! 🌟**