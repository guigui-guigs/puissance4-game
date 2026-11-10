// Real-Time P2P WebRTC Multiplayer Network Engine using PeerJS
export class NetworkManager {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomId = null;
    this.connected = false;
  }

  // Generate random room code
  static generateRoomId() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `p4-${code}`;
  }

  // Initialize Host
  createRoom(roomId = NetworkManager.generateRoomId()) {
    this.isHost = true;
    this.roomId = roomId;

    return new Promise((resolve, reject) => {
      try {
        const PeerClass = window.Peer;
        if (!PeerClass) {
          throw new Error('PeerJS non chargé');
        }

        this.peer = new PeerClass(this.roomId, {
          debug: 1,
        });

        this.peer.on('open', (id) => {
          this.roomId = id;
          if (this.callbacks.onRoomCreated) {
            this.callbacks.onRoomCreated(id, this.getShareUrl());
          }
          resolve(id);
        });

        this.peer.on('connection', (connection) => {
          this.setupConnection(connection);
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Host Error:', err);
          if (err.type === 'unavailable-id') {
            // Retry with a fresh ID
            this.createRoom(NetworkManager.generateRoomId()).then(resolve).catch(reject);
          } else {
            if (this.callbacks.onError) this.callbacks.onError(err.message || 'Erreur de connexion');
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Guest joins a room
  joinRoom(roomId) {
    this.isHost = false;
    this.roomId = roomId;

    return new Promise((resolve, reject) => {
      try {
        const PeerClass = window.Peer;
        if (!PeerClass) {
          throw new Error('PeerJS non chargé');
        }

        // Random client ID for guest
        const guestId = `p4-guest-${Math.random().toString(36).substring(2, 8)}`;
        this.peer = new PeerClass(guestId, { debug: 1 });

        this.peer.on('open', () => {
          const connection = this.peer.connect(roomId, { reliable: true });
          this.setupConnection(connection);
          resolve(roomId);
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Guest Error:', err);
          if (this.callbacks.onError) {
            this.callbacks.onError('Impossible de joindre la partie. Le code est-il valide ?');
          }
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  setupConnection(connection) {
    this.conn = connection;

    this.conn.on('open', () => {
      this.connected = true;
      if (this.callbacks.onConnected) {
        this.callbacks.onConnected({ isHost: this.isHost, roomId: this.roomId });
      }
    });

    this.conn.on('data', (data) => {
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(data);
      }
    });

    this.conn.on('close', () => {
      this.connected = false;
      if (this.callbacks.onDisconnected) {
        this.callbacks.onDisconnected();
      }
    });

    this.conn.on('error', (err) => {
      console.error('Connection error:', err);
      if (this.callbacks.onError) this.callbacks.onError('Erreur de liaison P2P');
    });
  }

  send(data) {
    if (this.conn && this.connected) {
      this.conn.send(data);
    }
  }

  getShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.roomId);
    return url.toString();
  }

  disconnect() {
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.connected = false;
    this.roomId = null;
  }
}
