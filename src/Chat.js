import React, { useState, useEffect } from "react";

function Chat({ socket, user }) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Listen for incoming messages
        socket.on("receiveMessage", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => socket.off("receiveMessage");
    }, [socket]);

    const sendMessage = () => {
        if (message.trim() === "") return;

        const newMessage = { sender: user.email, text: message };
        socket.emit("sendMessage", newMessage);
        setMessage("");
    };

    return (
        <div className="mt-6 w-full max-w-lg bg-gray-200 dark:bg-gray-800 p-4 rounded-md shadow-md">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Chat Box</h2>

            <div className="h-64 overflow-y-auto bg-white dark:bg-gray-900 p-2 rounded-md mb-2">
                {messages.map((msg, index) => (
                    <p key={index} className={`p-2 rounded-md mb-1 ${msg.sender === user.email ? "bg-blue-500 text-white self-end" : "bg-gray-300 text-black"}`}>
                        <strong>{msg.sender}: </strong>{msg.text}
                    </p>
                ))}
            </div>

            <div className="flex">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow p-2 border rounded-md text-black"
                />
                <button onClick={sendMessage} className="ml-2 bg-green-500 text-white px-4 py-2 rounded-md">
                    Send
                </button>
            </div>
        </div>
    );
}

export default Chat;
