import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { appendMessage, fetchConversations, fetchMessages, setActiveConversation } from "../store/messagesSlice";
import api from "../api/axios";
import toast from "react-hot-toast";
import Loader from "../components/Loader";

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
          <p className="small text-muted mb-2">You can still paste a 24-character user id if you have one.</p>
          {conversations.map((c) => (
            <button key={c._id} type="button" className="btn btn-light text-start mb-1 w-100" onClick={() => open(c._id)}>
              {c.participants.filter((p) => p._id !== user?._id).map((p) => `@${p.username}`).join(", ")}
            </button>
          ))}
        </div>
      </div>
      <div className="col-md-8">
        <div className="card p-3">
          {!activeConversationId && <Loader />}
          <div className="message-list">{activeMessages.map((m) => <div key={m._id} className="mb-2"><strong>{m.sender?.username}:</strong> {m.text}</div>)}</div>
          <button type="button" className="btn btn-sm btn-outline-secondary mb-2" onClick={loadMore} disabled={!activeConversationId}>Load older</button>
          <div className="input-group mt-2">
            <input className="form-control" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
            <button type="button" className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
