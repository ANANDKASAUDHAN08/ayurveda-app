import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoSessionService } from '../../shared/services/video-session.service';
import { WebRTCService } from '../../shared/services/webrtc.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { AuthService } from '../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-video-call',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './video-call.component.html',
    styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

    // Appointment & Session
    appointmentId!: number;
    sessionData: any = null;

    // Call state
    callActive = false;
    callDuration = 0;
    connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed' = 'idle';

    // Media controls
    audioEnabled = true;
    videoEnabled = true;

    // UI state
    loading = true;
    error = '';
    showControls = true;
    showMoreMenu = false;
    showChat = false;
    isScreenSharing = false;

    // Chat
    messages: any[] = [];
    newMessage = '';

    // Peer Info
    peerName = '';
    peerRole = '';
    peerInitials = '';

    // Local Info
    localName = '';
    localInitials = '';

    // Prevent multiple end call attempts
    private callEnded = false;

    // Timer
    private durationInterval?: any;

    constructor(
        private route: ActivatedRoute,
        public router: Router,
        private videoSessionService: VideoSessionService,
        private webrtcService: WebRTCService,
        private snackbar: SnackbarService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.appointmentId = +params['appointmentId'];
            if (!this.appointmentId) {
                this.error = 'Invalid appointment ID';
                this.loading = false;
            }
        });

        this.setupControlsAutoHide();
    }

    ngAfterViewInit() {
        if (this.appointmentId) {
            setTimeout(() => {
                this.initializeCall();
            }, 0);
        }
    }

    ngOnDestroy() {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
        }

        this.webrtcService.endCall();
    }

    async initializeCall() {
        try {
            this.loading = true;
            this.error = '';

            // Get video session details
            this.sessionData = await this.videoSessionService.getVideoSession(this.appointmentId).toPromise();

            if (!this.sessionData) {
                throw new Error('Session not found');
            }

            // Start session on backend
            await this.videoSessionService.startVideoCall(this.appointmentId).toPromise();

            // Set Names
            const user = this.authService.getUser();
            const role = this.authService.getRole();
            const appt = this.sessionData.data?.appointment || this.sessionData.appointment;

            this.localName = user?.name || (role === 'doctor' ? 'Doctor' : 'Patient');
            this.localInitials = this.localName.charAt(0).toUpperCase();

            if (role === 'doctor') {
                this.peerName = appt?.patient_name || 'Patient';
                this.peerRole = 'Patient';
            } else {
                this.peerName = appt?.doctor_name ? `Dr. ${appt.doctor_name}` : 'Doctor';
                this.peerRole = 'Specialist';
            }
            this.peerInitials = this.peerName.charAt(0).toUpperCase();

            this.loading = false;
            this.callActive = true;
            this.startDurationTimer();

            // Give Angular time to render the video elements
            await new Promise(resolve => setTimeout(resolve, 100));

            // Now setup WebRTC and attach streams
            await this.setupWebRTC();

        } catch (err: any) {
            console.error('Error initializing call:', err);

            // Fallback: If video failed due to device in use, try audio only
            if (err.name === 'NotReadableError' || err.message?.includes('in use')) {
                this.snackbar.warning('Camera in use, joining with audio only');
                this.videoEnabled = false;
                try {
                    await this.setupWebRTC();
                    this.loading = false;
                    this.callActive = true;
                    return;
                } catch (secondErr: any) {
                    this.error = secondErr.message || 'Failed to initialize call.';
                }
            } else {
                this.error = err.message || 'Failed to initialize call. Please try again.';
            }

            this.loading = false;
            this.snackbar.error(this.error);
        }
    }

    async setupWebRTC() {
        try {
            // Get room ID from session
            const roomId = this.sessionData.room_id || `room-${this.appointmentId}`;

            // Initialize stream with current video/audio settings
            const localStream = await this.webrtcService.initializeLocalStream(this.videoEnabled, this.audioEnabled);

            // Attach to video element
            if (this.localVideo?.nativeElement) {
                this.localVideo.nativeElement.srcObject = localStream;
                // Force play
                this.localVideo.nativeElement.play().catch(e => console.error('Play error:', e));
            } else {
                console.warn('⚠️ Local video element not found or not yet rendered');
            }

            // Connect to Socket.io and join room  
            this.webrtcService.connect();
            this.webrtcService.joinRoom(roomId);

            // One side needs to be initiator for simple-peer to work
            // Let the patient (user role) be the initiator
            const role = this.authService.getRole();
            const isInitiator = role === 'user';

            if (isInitiator) {
                // Patient: Wait for someone to join before initiating

                // Track if we've already created the peer to avoid duplicates
                let peerCreated = false;
                const startConnection = () => {
                    if (!peerCreated) {
                        peerCreated = true;
                        this.webrtcService.createPeer(roomId, true, localStream);
                    }
                };

                // Case A: Someone is already in the room when we join
                this.webrtcService.roomReady$.subscribe(ready => {
                    if (ready) startConnection();
                });

                // Case B: We are alone and someone joins later
                this.webrtcService.peerJoined$.subscribe(peerId => {
                    if (peerId) startConnection();
                });
            } else {
                // Doctor: Join immediately as non-initiator
                this.webrtcService.createPeer(roomId, false, localStream);
            }

            // Listen for remote stream
            this.webrtcService.remoteStream$.subscribe(remoteStream => {
                if (remoteStream && this.remoteVideo?.nativeElement) {
                    this.remoteVideo.nativeElement.srcObject = remoteStream;
                    this.connectionStatus = 'connected';
                }
            });

            // Listen for connection status
            this.webrtcService.connectionStatus$.subscribe(status => {
                this.connectionStatus = status as any;

                if (status === 'connected') {
                    this.snackbar.success('Connected to call');
                } else if (status === 'disconnected' || status === 'failed') {
                    if (!this.callEnded) {
                        if (status === 'disconnected') {
                            this.snackbar.warning('Call disconnected');
                        } else {
                            this.snackbar.error('Connection failed');
                        }
                        this.handleDisconnection();
                    }
                }
            });

            // Listen for chat messages
            this.webrtcService.messages$.subscribe(msgs => {
                this.messages = msgs;
                // Auto scroll to bottom (logic in template or afterViewChecked)
            });

        } catch (err: any) {
            console.error('WebRTC setup error:', err);
            throw err;
        }
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.webrtcService.toggleAudio(this.audioEnabled);
    }

    toggleVideo() {
        this.videoEnabled = !this.videoEnabled;
        this.webrtcService.toggleVideo(this.videoEnabled);
    }

    toggleMoreMenu() {
        this.showMoreMenu = !this.showMoreMenu;
    }

    toggleChat() {
        this.showChat = !this.showChat;
        this.showMoreMenu = false;
    }

    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                const stream = await this.webrtcService.startScreenShare();
                if (this.localVideo?.nativeElement) {
                    this.localVideo.nativeElement.srcObject = stream;
                }
                this.isScreenSharing = true;
                this.snackbar.success('Screen sharing started');
            } else {
                const stream = await this.webrtcService.stopScreenShare();
                if (this.localVideo?.nativeElement) {
                    this.localVideo.nativeElement.srcObject = stream;
                }
                this.isScreenSharing = false;
                this.snackbar.success('Screen sharing stopped');
            }
        } catch (err) {
            console.error('Screen sharing error:', err);
            this.snackbar.error('Could not share screen');
        }
        this.showMoreMenu = false;
    }

    sendMessage() {
        if (!this.newMessage.trim()) return;

        const roomId = this.sessionData.room_id || `room-${this.appointmentId}`;
        const sender = this.authService.getUser()?.name || 'User';

        this.webrtcService.sendMessage(roomId, this.newMessage, sender);
        this.newMessage = '';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        this.showMoreMenu = false;
    }

    async endCall() {
        // Prevent multiple calls
        if (this.callEnded) {
            return;
        }
        this.callEnded = true;

        try {
            // End session on backend
            if (this.appointmentId) {
                await this.videoSessionService.endVideoCall(this.appointmentId).toPromise();
            }

            // Disconnect WebRTC
            this.webrtcService.endCall();

            // Stop timer
            if (this.durationInterval) {
                clearInterval(this.durationInterval);
            }

            this.callActive = false;
            this.snackbar.success('Call ended');

            // Navigate back to appropriate dashboard
            setTimeout(() => {
                const role = this.authService.getRole();
                if (role === 'doctor') {
                    this.router.navigate(['/doctor/dashboard']);
                } else {
                    this.router.navigate(['/appointments/video']);
                }
            }, 1000);

        } catch (err) {
            console.error('Error ending call:', err);
            const role = this.authService.getRole();
            if (role === 'doctor') {
                this.router.navigate(['/doctor/dashboard']);
            } else {
                this.router.navigate(['/appointments/video']);
            }
        }
    }

    handleDisconnection() {
        this.connectionStatus = 'disconnected';

        // Try to reconnect once
        setTimeout(() => {
            if (this.connectionStatus === 'disconnected') {
                this.snackbar.error('Unable to reconnect. Please try joining again.');
                this.endCall();
            }
        }, 5000);
    }

    startDurationTimer() {
        this.callDuration = 0;
        this.durationInterval = setInterval(() => {
            this.callDuration++;
        }, 1000);
    }

    get formattedDuration(): string {
        const hours = Math.floor(this.callDuration / 3600);
        const minutes = Math.floor((this.callDuration % 3600) / 60);
        const seconds = this.callDuration % 60;

        if (hours > 0) {
            return `${hours}:${this.pad(minutes)}:${this.pad(seconds)}`;
        }
        return `${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    private pad(num: number): string {
        return num.toString().padStart(2, '0');
    }

    private setupControlsAutoHide() {
        let timeout: any;

        const resetTimer = () => {
            this.showControls = true;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.showControls = false;
            }, 3000);
        };

        // Show controls on mouse move
        document.addEventListener('mousemove', resetTimer);

        // Initial timer
        resetTimer();
    }

    get connectionIcon(): string {
        switch (this.connectionStatus) {
            case 'connected':
                return 'fa-circle text-green-500';
            case 'connecting':
                return 'fa-circle text-yellow-500 animate-pulse';
            case 'idle':
                return 'fa-circle text-primary-400 animate-pulse';
            case 'disconnected':
            case 'failed':
                return 'fa-circle text-rose-500';
            default:
                return 'fa-circle text-slate-500';
        }
    }

    get connectionText(): string {
        switch (this.connectionStatus) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'disconnected':
                return 'Disconnected';
            case 'failed':
                return 'Connection Failed';
            case 'idle':
                return 'Waiting for Peer...';
            default:
                return 'Ready';
        }
    }
}
