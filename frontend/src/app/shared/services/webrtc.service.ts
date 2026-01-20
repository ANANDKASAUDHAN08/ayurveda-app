import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root'
})
export class WebRTCService {
    private socket!: Socket;
    private peer: SimplePeer.Instance | null = null;

    // Observables for streams and connection status
    public localStream$ = new BehaviorSubject<MediaStream | null>(null);
    public remoteStream$ = new BehaviorSubject<MediaStream | null>(null);
    public connectionStatus$ = new BehaviorSubject<string>('idle');
    public error$ = new BehaviorSubject<string | null>(null);

    // Peer events
    public peerJoined$ = new BehaviorSubject<string | null>(null);
    public roomReady$ = new BehaviorSubject<boolean>(false);

    // Chat events
    public messages$ = new BehaviorSubject<any[]>([]);

    constructor() {
        // Initialize Socket.io connection
        this.socket = io(environment.apiUrl, {
            transports: ['websocket'],
            autoConnect: false
        });

        this.setupSocketListeners();
    }

    private setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
            this.connectionStatus$.next('socket-connected');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            this.connectionStatus$.next('disconnected');
        });

        this.socket.on('signal', (signal: any) => {
            if (this.peer) {
                this.peer.signal(signal);
            }
        });

        this.socket.on('peer-joined', (socketId: string) => {
            console.log('👤 Peer joined the room:', socketId);
            this.peerJoined$.next(socketId);
        });

        this.socket.on('room-ready', (data: any) => {
            this.roomReady$.next(true);
        });

        this.socket.on('peer-left', () => {
            console.log('👋 Peer left the room');
            this.handlePeerLeft();
        });

        this.socket.on('chat-message', (data: any) => {
            console.log('💬 Received message:', data);
            const currentMessages = this.messages$.value;
            this.messages$.next([...currentMessages, data]);
        });
    }

    async initializeLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
        // Reset state for a fresh session
        this.connectionStatus$.next('idle');
        this.error$.next(null);
        this.messages$.next([]);
        this.peerJoined$.next(null);
        this.roomReady$.next(false);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: video ? { width: 1280, height: 720 } : false,
                audio: audio
            });

            this.localStream$.next(stream);
            console.log('🎥 Local stream initialized');
            return stream;
        } catch (error) {
            console.error('❌ Failed to get media devices:', error);
            this.error$.next('Failed to access camera/microphone');
            throw error;
        }
    }

    connect() {
        if (!this.socket.connected) {
            this.socket.connect();
        }
    }

    joinRoom(roomId: string) {
        console.log(`🚪 Joining room: ${roomId}`);
        this.socket.emit('join-room', roomId);
    }

    sendMessage(roomId: string, message: string, sender: string) {
        const messageData = { message, sender, timestamp: new Date() };
        // Add to local display immediately
        const currentMessages = this.messages$.value;
        this.messages$.next([...currentMessages, { ...messageData, isMe: true }]);
        // Send to peer
        this.socket.emit('chat-message', { roomId, ...messageData });
    }

    /**
     * Create peer connection
     * @param roomId - Room ID  
     * @param initiator - Whether this peer initiates the connection
     * @param stream - Local media stream
     */
    createPeer(roomId: string, initiator: boolean, stream: MediaStream): SimplePeer.Instance {
        console.log(`🔗 Creating peer (initiator: ${initiator})`);

        this.peer = new SimplePeer({
            initiator,
            trickle: false, // Wait for all ICE candidates before sending
            stream
        });

        // Handle signaling
        this.peer.on('signal', (signal: any) => {
            this.socket.emit('signal', { roomId, signal });
        });

        // Handle incoming stream
        this.peer.on('stream', (remoteStream: MediaStream) => {
            console.log('📹 Received remote stream');
            this.remoteStream$.next(remoteStream);
            this.connectionStatus$.next('connected');
        });

        // Handle connection establishment
        this.peer.on('connect', () => {
            console.log('✅ Peer connection established');
            this.connectionStatus$.next('connected');
        });

        // Handle errors
        this.peer.on('error', (err: Error) => {
            console.error('❌ Peer error:', err);
            this.error$.next(`Connection error: ${err.message}`);
            this.connectionStatus$.next('error');
        });

        // Handle connection close
        this.peer.on('close', () => {
            console.log('🔌 Peer connection closed');
            this.connectionStatus$.next('disconnected');
        });

        this.connectionStatus$.next('connecting');
        return this.peer;
    }

    private handlePeerLeft() {
        this.remoteStream$.next(null);
        this.connectionStatus$.next('peer-disconnected');
    }

    toggleAudio(enabled: boolean) {
        const stream = this.localStream$.value;
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
            console.log(`🎤 Audio ${enabled ? 'enabled' : 'muted'}`);
        }
    }

    toggleVideo(enabled: boolean) {
        const stream = this.localStream$.value;
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
            console.log(`📹 Video ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    async startScreenShare(): Promise<MediaStream> {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            const currentStream = this.localStream$.value;
            if (this.peer && currentStream) {
                // Remove existing video track
                const videoTrack = currentStream.getVideoTracks()[0];
                const newVideoTrack = screenStream.getVideoTracks()[0];

                if (videoTrack && newVideoTrack) {
                    this.peer.replaceTrack(videoTrack, newVideoTrack, currentStream);
                }
            }

            this.localStream$.next(screenStream);
            return screenStream;
        } catch (error) {
            console.error('❌ Failed to start screen share:', error);
            throw error;
        }
    }

    async stopScreenShare() {
        // Just re-initialize the normal stream
        const stream = this.localStream$.value;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        return this.initializeLocalStream();
    }

    isAudioEnabled(): boolean {
        const stream = this.localStream$.value;
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            return audioTrack ? audioTrack.enabled : false;
        }
        return false;
    }

    isVideoEnabled(): boolean {
        const stream = this.localStream$.value;
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            return videoTrack ? videoTrack.enabled : false;
        }
        return false;
    }

    endCall() {
        console.log('📞 Ending call...');

        // Destroy peer connection
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        // Stop local stream
        const localStream = this.localStream$.value;
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream$.next(null);
        }

        // Clear remote stream
        this.remoteStream$.next(null);

        // Disconnect socket
        if (this.socket.connected) {
            this.socket.disconnect();
        }

        this.connectionStatus$.next('disconnected');
        this.peerJoined$.next(null);
        this.roomReady$.next(false);
        console.log('✅ Call ended, resources cleaned up');
    }

    getConnectionStatus(): Observable<string> {
        return this.connectionStatus$.asObservable();
    }

    getLocalStream(): Observable<MediaStream | null> {
        return this.localStream$.asObservable();
    }

    getRemoteStream(): Observable<MediaStream | null> {
        return this.remoteStream$.asObservable();
    }

    getErrors(): Observable<string | null> {
        return this.error$.asObservable();
    }
}
