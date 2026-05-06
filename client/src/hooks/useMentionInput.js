import { useState, useRef, useCallback, useEffect } from "react";
import api from "../api/axios";

const useMentionInput = (value, onChange) => {
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const slice = text.slice(0, cursor);
    // Allow spaces in usernames: match @ followed by word chars and spaces
    const match = slice.match(/@([\w ]*)$/);
    if (match) {
      const rawQ = match[1];
      const q = rawQ.trimEnd(); // trim trailing spaces before searching
      // rawLen is the full length of the match (including @) for correct replacement
      const rawLen = match[0].length;
      setMentionQuery({ start: cursor - rawLen, rawLen, q });
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (!q) { setSuggestions([]); return; }
        try {
          const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
          setSuggestions(data.slice(0, 6));
        } catch {
          setSuggestions([]);
        }
      }, 200);
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  }, [onChange]);

  const pickSuggestion = useCallback((username) => {
    if (!mentionQuery) return;
    const before = value.slice(0, mentionQuery.start);
    // Use rawLen to skip the full @... text the user typed (including spaces)
    const after = value.slice(mentionQuery.start + mentionQuery.rawLen);
    onChange(`${before}@${username} ${after}`);
    setMentionQuery(null);
    setSuggestions([]);
  }, [value, mentionQuery, onChange]);

  const closeSuggestions = useCallback(() => {
    setSuggestions([]);
    setMentionQuery(null);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return { handleChange, suggestions, pickSuggestion, closeSuggestions, showDropdown: suggestions.length > 0 };
};

export default useMentionInput;
