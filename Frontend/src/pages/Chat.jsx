import React, { useState, useEffect, useRef } from "react";
import { useAuth, apiInstance } from "../context/AuthContext";
import { useSnackbar } from "notistack";
import Navbar from "../components/Navbar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import HashLoader from "react-spinners/HashLoader";
import { useLocation } from "react-router-dom";

export default function Chat() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();

  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Parse state passed via navigation (e.g. from Details page "Chat with Founder")
  const defaultPartner = location.state?.partner; // { id, username }
  const contextItem = location.state?.item; // { id, title }

  useEffect(() => {
    fetchPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default partner if navigated from details page
  useEffect(() => {
    if (defaultPartner) {
      setActivePartner(defaultPartner);
      // Ensure the partner is added to the list if not already there
      setPartners((prev) => {
        if (prev.some((p) => p.id === defaultPartner.id)) return prev;
        return [defaultPartner, ...prev];
      });
    }
  }, [defaultPartner]);

  // Fetch history when active partner changes
  useEffect(() => {
    if (activePartner) {
      fetchChatHistory(activePartner.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartner]);

  // Connect to WebSockets
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Use ws:// localhost for web sockets
    const wsUrl = `ws://localhost:8000/ws/chat?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          enqueueSnackbar(msg.error, { variant: "error" });
          return;
        }

        // If message is from/to active partner, append to conversation stream
        if (
          activePartner &&
          (msg.senderId === activePartner.id || msg.receiverId === activePartner.id)
        ) {
          setMessages((prev) => {
            // Avoid duplicate appends (since we also receive our own confirmation)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }

        // Proactively refresh chat threads list
        fetchPartnersSilent();
      } catch (err) {
        console.error("WS error parsing text message: ", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [activePartner, enqueueSnackbar]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPartners = async () => {
    setLoadingPartners(true);
    try {
      const response = await apiInstance.get("/chat/list");
      setPartners(response.data);
      if (response.data.length > 0 && !defaultPartner) {
        setActivePartner(response.data[0]);
      }
    } catch (error) {
      enqueueSnackbar("Error fetching conversation threads", { variant: "error" });
    } finally {
      setLoadingPartners(false);
    }
  };

  const fetchPartnersSilent = async () => {
    try {
      const response = await apiInstance.get("/chat/list");
      setPartners(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChatHistory = async (partnerId) => {
    setLoadingHistory(true);
    try {
      const response = await apiInstance.get(`/chat/history/${partnerId}`);
      setMessages(response.data);
    } catch (error) {
      enqueueSnackbar("Failed to load chat history", { variant: "error" });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      enqueueSnackbar("Connecting to chat server...", { variant: "warning" });
      return;
    }

    const payload = {
      receiverId: activePartner.id,
      message: inputText,
      itemId: contextItem?.id || null,
    };

    socketRef.current.send(JSON.stringify(payload));
    setInputText("");
  };

  return (
    <main id="chatPage">
      <Navbar />
      <section className="chat-container-layout">
        {/* Sidebar conversation list */}
        <div className={`chat-sidebar ${activePartner ? "hidden-mobile" : ""}`}>
          <div className="sidebar-header">
            <h3>Conversations</h3>
          </div>
          {loadingPartners ? (
            <div className="sidebar-loader">
              <HashLoader color="#fdf004" size={30} />
            </div>
          ) : partners.length === 0 ? (
            <div className="sidebar-empty">
              <ChatIcon />
              <p>No active chats</p>
              <span>Initiate chat with founders from the Item Details page.</span>
            </div>
          ) : (
            <div className="sidebar-list">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className={`partner-item ${activePartner?.id === partner.id ? "active" : ""}`}
                  onClick={() => setActivePartner(partner)}
                >
                  <div className="avatar">{partner.username.substring(0, 2).toUpperCase()}</div>
                  <div className="info">
                    <p className="name">{partner.username}</p>
                    <span className="role">{partner.role.toLowerCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat screen panel */}
        <div className={`chat-screen ${!activePartner ? "hidden-mobile" : ""}`}>
          {activePartner ? (
            <>
              <div className="screen-header">
                <button className="back-btn" onClick={() => setActivePartner(null)}>
                  <ArrowBackIcon />
                </button>
                <div className="partner-details">
                  <p className="name">{activePartner.username}</p>
                  <span className="status">online</span>
                </div>
                {contextItem && (
                  <div className="context-banner">
                    Item: <strong>{contextItem.title}</strong>
                  </div>
                )}
              </div>

              {/* Message history */}
              <div className="screen-history">
                {loadingHistory ? (
                  <div className="history-loader">
                    <HashLoader color="#fdf004" size={40} />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="history-empty">
                    <p>No messages yet. Send a message to start chatting!</p>
                  </div>
                ) : (
                  <div className="message-list">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`message-bubble-wrapper ${isMe ? "me" : "them"}`}>
                          {!isMe && <div className="avatar-small">{msg.senderName.substring(0, 2).toUpperCase()}</div>}
                          <div className="bubble-content">
                            {msg.itemTitle && (
                              <div className="message-item-ref">
                                Regarding: {msg.itemTitle}
                              </div>
                            )}
                            <p className="text">{msg.message}</p>
                            <span className="timestamp">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input section */}
              <form className="screen-input-area" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type secure message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  required
                />
                <button type="submit" className="send-btn">
                  <SendIcon />
                </button>
              </form>
            </>
          ) : (
            <div className="screen-placeholder">
              <ChatIcon />
              <h3>Secure Messenger</h3>
              <p>Select a contact from the sidebar to chat securely.</p>
              <span>Personal details like phone numbers and email addresses are hidden for privacy.</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
