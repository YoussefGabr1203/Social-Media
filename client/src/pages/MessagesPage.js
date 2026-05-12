import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { appendMessage, fetchConversations, fetchMessages, setActiveConversation } from "../store/messagesSlice";
import api from "../api/axios";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import assetUrl from "../utils/assetUrl";

const isLikelyObjectId = (s) => /^[a-fA-F0-9]{24}$/.test(s.trim());

const MessagesPage = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversationId, activeMessages } = useSelector((s) => s.messages);
  const user = useSelector((s) => s.auth.user);
  const [text, setText] = useState("");
  const [recipient, setRecipient] = useState("");
  const [messagePage, setMessagePage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => { dispatch(fetchConversations()); }, [dispatch]);

  const open = (id) => {
    setMessagePage(1);
    dispatch(setActiveConversation(id));
    dispatch(fetchMessages({ id, page: 1 }));
  };

  const createConversation = async () => {
    const q = recipient.trim();
    if (!q) return;
    setLoading(true);
    try {
      const body = isLikelyObjectId(q) ? { participantId: q } : { participantUsername: q };
      const { data } = await api.post("/conversations", body);
      setRecipient("");
      dispatch(fetchConversations());
      open(data._id);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!text.trim() || !activeConversationId) return;
    try {
      const { data } = await api.post(`/conversations/${activeConversationId}/messages`, { text });
      dispatch(appendMessage(data));
      setText("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  };

  const loadMore = async () => {
    if (!activeConversationId) return;
    const nextPage = messagePage + 1;
    await dispatch(fetchMessages({ id: activeConversationId, page: nextPage }));
    setMessagePage(nextPage);
  };

  const getOtherParticipants = (conv) =>
    conv.participants.filter((p) => p._id !== user?._id);

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <div className="card p-2">
          <label className="form-label small text-muted mb-1">Message someone</label>
          <div className="input-group mb-2">
            <input
              className="form-control"
              placeholder="Username (e.g. jane_doe)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createConversation())}
            />
            <button type="button" className="btn btn-outline-primary" onClick={createConversation} disabled={loading}>
              Chat
            </button>
          </div>

          {conversations.map((c) => {
            const others = getOtherParticipants(c);
            const isActive = c._id === activeConversationId;
            return (
              <button
                key={c._id}
                type="button"
                className={`btn text-start mb-1 w-100 d-flex align-items-center gap-2 ${isActive ? "btn-primary" : "btn-light"}`}
                onClick={() => open(c._id)}
              >
                {others[0]?.profilePicture ? (
                  <img
                    src={assetUrl(others[0].profilePicture)}
                    alt={others[0].username}
                    className="rounded-circle flex-shrink-0"
                    width={32}
                    height={32}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white flex-shrink-0"
                    style={{ width: 32, height: 32, fontSize: 12 }}
                  >
                    {others[0]?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <span className="text-truncate">
                  {others.map((p) => `@${p.username}`).join(", ")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="col-md-8">
        <div className="card p-3">
          {!activeConversationId && <Loader />}
          <div className="message-list mb-2">
            {activeMessages.map((m) => {
              const isMine = m.sender?._id === user?._id || m.sender === user?._id;
              return (
                <div key={m._id} className={`mb-2 d-flex align-items-start gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                  {m.sender?.username && (
                    <Link to={`/profile/${encodeURIComponent(m.sender.username)}`} className="flex-shrink-0">
                      {m.sender?.profilePicture ? (
                        <img
                          src={assetUrl(m.sender.profilePicture)}
                          alt={m.sender.username}
                          className="rounded-circle"
                          width={28}
                          height={28}
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                          style={{ width: 28, height: 28, fontSize: 11 }}
                        >
                          {m.sender.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </Link>
                  )}
                  <div className={`rounded p-2 small ${isMine ? "bg-primary text-white" : "bg-light"}`} style={{ maxWidth: "70%" }}>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary mb-2" onClick={loadMore} disabled={!activeConversationId}>
            Load older
          </button>
          <div className="input-group mt-2">
            <input
              className="form-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())}
            />
            <button type="button" className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
