const socket = io();

const startCallButton = document.getElementById('startCall');
let localStream;
let peerConnection;
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

startCallButton.addEventListener('click', async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            socket.emit('candidate', candidate);
        }
    };

    peerConnection.ontrack = (event) => {
        const audio = document.createElement('audio');
        audio.srcObject = event.streams[0];
        audio.play();
        document.body.appendChild(audio);
    };

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
});

socket.on('offer', async (offer) => {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            socket.emit('candidate', candidate);
        }
    };

    peerConnection.ontrack = (event) => {
        const audio = document.createElement('audio');
        audio.srcObject = event.streams[0];
        audio.play();
        document.body.appendChild(audio);
    };

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', async (candidate) => {
    try {
        await peerConnection.addIceCandidate(candidate);
    } catch (e) {
        console.error('Error adding received ice candidate', e);
    }
});
