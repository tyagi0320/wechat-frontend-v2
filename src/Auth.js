import React, { useState } from "react";
import { auth, googleProvider } from "./firebaseconfig";
import { sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup } from "firebase/auth";

function Auth({ onLogin }) {
    const [email, setEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const sendOtp = async () => {
        const actionCodeSettings = {
            url: "http://localhost:3000",
            handleCodeInApp: true
        };

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            localStorage.setItem("emailForSignIn", email);
            setOtpSent(true);
            alert("OTP sent! Check your email.");
        } catch (err) {
            alert("Error sending OTP: " + err.message);
        }
    };

    const verifyOtp = async () => {
        try {
            const storedEmail = localStorage.getItem("emailForSignIn");
            if (!storedEmail) throw new Error("No email found, try again.");

            await signInWithEmailLink(auth, storedEmail, window.location.href);
            localStorage.removeItem("emailForSignIn");
            onLogin({ email: storedEmail });
        } catch (err) {
            alert("Error verifying OTP: " + err.message);
        }
    };

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            onLogin({ email: user.email, name: user.displayName, photo: user.photoURL });
        } catch (err) {
            alert("Google Sign-In Failed: " + err.message);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg text-white">
            <h2 className="text-xl mb-4">Login to WeChat</h2>

            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 mb-3 border rounded-md text-black"
            />
            {!otpSent ? (
                <button onClick={sendOtp} className="bg-blue-500 px-4 py-2 rounded-md">Send OTP</button>
            ) : (
                <button onClick={verifyOtp} className="bg-green-500 px-4 py-2 rounded-md">Verify OTP</button>
            )}

            <div className="my-4 text-center text-gray-400">OR</div>

            <button onClick={signInWithGoogle} className="bg-red-500 px-4 py-2 rounded-md">
                Sign in with Google
            </button>
        </div>
    );
}

export default Auth;
