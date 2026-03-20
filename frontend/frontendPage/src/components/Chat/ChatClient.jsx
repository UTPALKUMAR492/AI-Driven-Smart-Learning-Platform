import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ChatClient({ room = 'global', user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const socketRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { withCredentials: true });
    socketRef.current.emit('join', room);
    socketRef.current.on('history', (msgs) => setMessages(msgs));
    socketRef.current.on('chat', (msg) => setMessages((m) => [...m, msg]));
    socketRef.current.on('file', (fileMsg) => setMessages((m) => [...m, { ...fileMsg, type: 'file' }]));
    return () => socketRef.current.disconnect();
  }, [room]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { room, sender: user?.name || 'Anonymous', text: input, time: Date.now() };
    socketRef.current.emit('chat', msg);
    setInput('');
  };

  const sendFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      socketRef.current.emit('file', { room, fileName: f.name, fileData: base64 });
    };
    reader.readAsDataURL(f);
    setFile(null);
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, maxWidth: 400, margin: '0 auto' }}>
      <div style={{ height: 250, overflowY: 'auto', marginBottom: 8, background: '#fafafa', padding: 8 }}>
        {messages.map((msg, i) =>
          msg.type === 'file' ? (
            <div key={i} style={{ margin: '8px 0' }}>
              <b>{msg.sender || 'File'}:</b> <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">{msg.fileName}</a>
            </div>
          ) : (
            <div key={i} style={{ margin: '4px 0' }}>
              <b>{msg.sender}:</b> {msg.text} <span style={{ color: '#888', fontSize: 10 }}>{new Date(msg.time).toLocaleTimeString()}</span>
            </div>
          )
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 4 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button type="submit">Send</button>
        <input type="file" style={{ display: 'none' }} id="chat-file" onChange={sendFile} />
        <label htmlFor="chat-file" style={{ cursor: 'pointer', marginLeft: 4 }} title="Send file">📎</label>
      </form>
    </div>
  );
}
