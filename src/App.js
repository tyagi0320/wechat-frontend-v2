import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Auth from "./Auth";
import Chat from "./Chat"; 
import { auth } from "./firebaseconfig";
import "./App.css"; 

const socket = io.connect("wss://wechat-backend-v2.onrender.com");

function App() {
    const [user, setUser] = useState(null);
    const [peerEmail, setPeerEmail] = useState("");
    const [stream, setStream] = useState(null);
    const [callConnected, setCallConnected] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callerEmail, setCallerEmail] = useState("");
    const [callerSignal, setCallerSignal] = useState(null);
    const myVideoRef = useRef(null);
    const peerVideoRef = useRef(null);
    const connectionRef = useRef(null);

    useEffect(() => {
        // Request camera & mic permissions
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = currentStream;
                }
            }).catch((error) => console.error("Error accessing media devices:", error));
        
        // Handle authentication state
        auth.onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                setUser({ email: firebaseUser.email });
                socket.emit("register", firebaseUser.email);
            }
        });

        // Listen for incoming calls
        socket.on("callUser", ({ from, signal }) => {
            setIncomingCall(true);
            setCallerEmail(from);
            setCallerSignal(signal);
        });

        return () => {
            socket.off("callUser");
        };
    }, []);

    const initiateCall = () => {
        if (!peerEmail) {
            alert("Enter an email to call");
            return;
        }

        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on("signal", (data) => {
            socket.emit("callUser", { email: peerEmail, signalData: data, from: user.email });
        });

        peer.on("stream", (peerStream) => {
            console.log("✅ Receiving peer stream:", peerStream);

            if (peerVideoRef.current) {
                console.log("✅ Assigning peer stream to video element");
                peerVideoRef.current.srcObject = peerStream;
            } else {
                console.warn("⚠️ peerVideoRef not available immediately. Retrying...");
                
                setTimeout(() => {
                    if (peerVideoRef.current) {
                        peerVideoRef.current.srcObject = peerStream;
                        console.log("✅ Successfully assigned after retry");
                    } else {
                        console.error("❌ peerVideoRef is still not available");
                    }
                }, 1000);
            }
        });

        socket.on("callAccepted", (signal) => {
            setCallConnected(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallConnected(true);

        const peer = new Peer({ initiator: false, trickle: false, stream });

        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: callerEmail });
        });

        peer.on("stream", (peerStream) => {
            console.log("✅ Receiving peer stream:", peerStream);
            
            if (peerVideoRef.current) {
                console.log("✅ Assigning peer stream to video element");
                peerVideoRef.current.srcObject = peerStream;
            } else {
                console.warn("⚠️ peerVideoRef not available immediately. Retrying...");
                
                setTimeout(() => {
                    if (peerVideoRef.current) {
                        peerVideoRef.current.srcObject = peerStream;
                        console.log("✅ Successfully assigned after retry");
                    } else {
                        console.error("❌ peerVideoRef is still not available");
                    }
                }, 1000);
            }
        });

        peer.signal(callerSignal);
        connectionRef.current = peer;
    };

    const handleLogout = () => {
        auth.signOut();
        setUser(null);
    };

    return (
        <div className="container">
            <h1 className="title">WeChat - Video Call App</h1>

            {!user ? (
                <Auth onLogin={setUser} />
            ) : (
                <div>
                    <p>Welcome, {user.email}</p>
                    <button onClick={handleLogout} className="end-call-btn">Logout</button>

                    <div className="video-container">
                        <div>
                            <video ref={myVideoRef} autoPlay playsInline className="video" />
                            <p>My Video</p>
                        </div>
                        <div>
                            <video ref={peerVideoRef} autoPlay playsInline className="video" style={{ display: callConnected ? "block" : "none" }} />
                            <p>{callConnected ? "Peer Video" : "No Call Yet"}</p>
                        </div>
                    </div>

                    <div className="myId">
                        <input
                            type="email"
                            placeholder="Enter peer email"
                            value={peerEmail}
                            onChange={(e) => setPeerEmail(e.target.value)}
                            className="chat-input"
                        />
                        <button onClick={initiateCall} className="call-btn">Start Call</button>
                    </div>

                    {incomingCall && !callConnected && (
                        <div className="caller">
                            <p>{callerEmail} is calling you...</p>
                            <button onClick={answerCall} className="answer-btn">Answer Call</button>
                        </div>
                    )}

                    {callConnected && <Chat socket={socket} user={user} />}
                </div>
            )}
        </div>
    );
}

export default App;
