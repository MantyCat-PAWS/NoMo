import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";

const CURRENCY = "Paws";
const CURRENCY_SINGULAR = "Paw";
const EURO_TO_PAW = 10;
// Trag hier die E-Mail-Adresse ein, mit der ihr euch als Betreiber:in registriert,
// dann seht ihr das Meldungen-Panel für 1-Stern-Bewertungen.
const ADMIN_EMAILS = ["admin@mantycat.at"];

const AVATARS = ["🐾", "🐱", "🐈‍⬛", "🦁", "🐯", "🐆", "🦥", "🐣"];
const PROFILE_COLORS = [
  { id: "lime", hex: "#C6FF6B" },
  { id: "rust", hex: "#B5501F" },
  { id: "moss", hex: "#2E4A3C" },
  { id: "teal", hex: "#3F7C7A" },
  { id: "mustard", hex: "#D6A429" },
  { id: "plum", hex: "#7A4A6A" },
];
const COLORS = {
  ink: "#1B1F1B",
  paper: "#F4F2E8",
  moss: "#2E4A3C",
  mossDark: "#1F3329",
  lime: "#C6FF6B",
  rust: "#B5501F",
  stone: "#DAD5C3",
};
const CATS = [
  { id: "sache", label: "Sachen", physical: true },
  { id: "dienstleistung", label: "Dienstleistungen", physical: false },
  { id: "hobby", label: "Hobby zum Ausprobieren", physical: true },
];

function euroToPaws(euro) {
  const n = Number(euro);
  if (!n || n <= 0) return 0;
  return Math.max(1, Math.round(n / EURO_TO_PAW));
}
function convKey(a, b, itemId) {
  return [a, b].sort().join("|") + "::" + (itemId || "general");
}
function catInfo(id) {
  return CATS.find((x) => x.id === id) || CATS[0];
}
function colorHex(id) {
  const c = PROFILE_COLORS.find((x) => x.id === id);
  return c ? c.hex : COLORS.ink;
}

function PawCoin({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r="19" fill={COLORS.lime} stroke={COLORS.ink} strokeWidth="2" />
      <circle cx="20" cy="20" r="15" fill="none" stroke={COLORS.ink} strokeWidth="1" opacity="0.35" />
      <g fill={COLORS.ink}>
        <ellipse cx="20" cy="24" rx="7" ry="6" />
        <ellipse cx="11.5" cy="15" rx="3" ry="3.8" transform="rotate(-18 11.5 15)" />
        <ellipse cx="17.5" cy="10.5" rx="3" ry="3.8" transform="rotate(-6 17.5 10.5)" />
        <ellipse cx="23.5" cy="10.5" rx="3" ry="3.8" transform="rotate(6 23.5 10.5)" />
        <ellipse cx="29" cy="15" rx="3" ry="3.8" transform="rotate(18 29 15)" />
      </g>
    </svg>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, color: n <= value ? COLORS.rust : COLORS.stone, padding: 2 }}>★</button>
      ))}
    </div>
  );
}

function RatingWidget({ item, onSubmit, submitting }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  return (
    <div style={styles.ratingBox}>
      <div style={styles.ratingLabel}>Wie war der Tausch mit {item.owner_display_name}?</div>
      <StarPicker value={stars} onChange={setStars} />
      <input className="mc-input" style={{ ...styles.input, marginTop: 6 }} placeholder="Kommentar (optional)"
        value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="button" style={styles.smallBtn} disabled={stars === 0 || submitting}
        onClick={() => onSubmit(item, stars, comment)}>
        {submitting ? "wird gesendet…" : "Bewertung abgeben"}
      </button>
    </div>
  );
}

function TradeOfferForm({ item, myListings, onSubmit, onCancel, submitting }) {
  const [selected, setSelected] = useState(myListings[0]?.id || "");
  const [message, setMessage] = useState("");
  if (myListings.length === 0) {
    return <div style={styles.tradeBox}>Du hast noch kein eigenes verfügbares Angebot zum Eintauschen. Häng zuerst selbst einen Zettel auf.</div>;
  }
  return (
    <div style={styles.tradeBox}>
      <label style={styles.label}>
        Dein Angebot im Tausch
        <select className="mc-input" style={styles.input} value={selected} onChange={(e) => setSelected(e.target.value)}>
          {myListings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </label>
      <input className="mc-input" style={{ ...styles.input, marginTop: 8 }} placeholder="Nachricht (optional)"
        value={message} onChange={(e) => setMessage(e.target.value)} />
      <div style={styles.tradeShippingNote}>Beim Direkttausch fließen keine {CURRENCY}, Versandkosten trägt jede Seite selbst.</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button" style={styles.smallBtn} disabled={submitting} onClick={() => onSubmit(item, selected, message)}>
          {submitting ? "wird gesendet…" : "Tauschangebot senden"}
        </button>
        <button type="button" style={styles.smallBtnGhostInk} onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  );
}

function MessageForm({ item, onSubmit, onCancel, submitting }) {
  const [text, setText] = useState("");
  return (
    <div style={styles.tradeBox}>
      <textarea className="mc-input" style={{ ...styles.input, minHeight: 60, resize: "vertical" }}
        placeholder={`Nachricht an ${item.owner_display_name}…`} value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button" style={styles.smallBtn} disabled={!text.trim() || submitting} onClick={() => onSubmit(item, text)}>
          {submitting ? "wird gesendet…" : "Senden"}
        </button>
        <button type="button" style={styles.smallBtnGhostInk} onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  );
}

function TicketCard({ item, isMine, canAfford, onDelete, onRequest, requesting, showRating, onRate, ratingSubmitting, myListings, tradeFormOpen, onToggleTradeForm, onSubmitTrade, tradeSubmitting, msgFormOpen, onToggleMsgForm, onSubmitMessage, msgSubmitting }) {
  const info = catInfo(item.category);
  const total = item.price + (item.shipping_paws || 0);
  const accent = item.owner_accent_color ? colorHex(item.owner_accent_color) : COLORS.ink;
  return (
    <div style={{ ...styles.ticket, opacity: item.status === "vergeben" ? 0.55 : 1 }}>
      <div style={styles.ticketMain}>
        <div style={styles.badgeRow}>
          <span style={styles.catBadge}>{info.label}</span>
          {item.status === "vergeben" && <span style={styles.soldBadge}>VERGEBEN</span>}
        </div>
        <h3 style={styles.ticketTitle}>{item.title}</h3>
        <p style={styles.ticketDesc}>{item.description}</p>
        {item.category === "dienstleistung" && item.hours && (
          <div style={styles.metaLine}>{item.hours} Std. à {item.hourly_rate_euro} €</div>
        )}
        <div style={styles.priceRow}>
          <PawCoin size={20} />
          <span style={styles.priceValue}>{item.price}</span>
          <span style={styles.priceLabel}>{item.price === 1 ? CURRENCY_SINGULAR : CURRENCY}</span>
        </div>
        {info.physical && item.shipping_paws > 0 && (
          <div style={styles.shippingLine}>+ {item.shipping_paws} {item.shipping_paws === 1 ? CURRENCY_SINGULAR : CURRENCY} Versand (zahlt Empfänger:in)</div>
        )}
        {isMine && item.status !== "vergeben" && (
          <button style={styles.deleteLink} onClick={() => onDelete(item.id)}>Zettel abhängen</button>
        )}
        {!isMine && item.status !== "vergeben" && (
          <div style={styles.actionRow}>
            <button style={{ ...styles.requestBtn, ...(canAfford ? {} : styles.requestBtnDisabled) }}
              onClick={() => onRequest(item)} disabled={requesting || !canAfford}>
              {requesting ? "einen Moment…" : canAfford ? `Für ${total} ${total === 1 ? CURRENCY_SINGULAR : CURRENCY} anfordern` : "zu wenig " + CURRENCY}
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={styles.tradeToggleBtn} onClick={() => onToggleTradeForm(item.id)}>
                {tradeFormOpen ? "Tausch schließen" : "Direkt tauschen"}
              </button>
              <button style={styles.msgToggleBtn} onClick={() => onToggleMsgForm(item.id)}>
                {msgFormOpen ? "Nachricht schließen" : "Nachricht"}
              </button>
            </div>
          </div>
        )}
        {!isMine && tradeFormOpen && (
          <TradeOfferForm item={item} myListings={myListings} onSubmit={onSubmitTrade} onCancel={() => onToggleTradeForm(item.id)} submitting={tradeSubmitting} />
        )}
        {!isMine && msgFormOpen && (
          <MessageForm item={item} onSubmit={onSubmitMessage} onCancel={() => onToggleMsgForm(item.id)} submitting={msgSubmitting} />
        )}
        {showRating && <RatingWidget item={item} onSubmit={onRate} submitting={ratingSubmitting} />}
      </div>
      <div style={{ ...styles.ticketStub, borderLeftColor: accent }}>
        <div style={{ ...styles.hole, borderColor: accent }} />
        <div style={styles.ticketCode}>#{item.code}</div>
        {item.owner_avatar && <div style={styles.ticketAvatar}>{item.owner_avatar}</div>}
        <div style={styles.ticketBy}>{item.owner_display_name}</div>
        <div style={styles.ticketLoc}>{item.location}</div>
        <div style={{ ...styles.hole, borderColor: accent }} />
      </div>
    </div>
  );
}

function ProfileEditor({ profile, onSave, saving }) {
  const [avatar, setAvatar] = useState(profile.avatar || AVATARS[0]);
  const [accentColor, setAccentColor] = useState(profile.accent_color || "ink");
  const [motto, setMotto] = useState(profile.motto || "");
  const [bio, setBio] = useState(profile.bio || "");
  return (
    <div style={styles.profileForm}>
      <div style={styles.label}>Avatar</div>
      <div style={styles.avatarRow}>
        {AVATARS.map((a) => (
          <button key={a} type="button" onClick={() => setAvatar(a)} style={{ ...styles.avatarBtn, ...(avatar === a ? styles.avatarBtnActive : {}) }}>{a}</button>
        ))}
      </div>
      <div style={styles.label}>Akzentfarbe</div>
      <div style={styles.colorRow}>
        <button type="button" onClick={() => setAccentColor("ink")} style={{ ...styles.colorSwatch, background: COLORS.ink, ...(accentColor === "ink" ? styles.colorSwatchActive : {}) }} />
        {PROFILE_COLORS.map((c) => (
          <button key={c.id} type="button" onClick={() => setAccentColor(c.id)} style={{ ...styles.colorSwatch, background: c.hex, ...(accentColor === c.id ? styles.colorSwatchActive : {}) }} />
        ))}
      </div>
      <label style={styles.label}>
        Motto
        <input className="mc-input" style={styles.input} value={motto} maxLength={50} onChange={(e) => setMotto(e.target.value)} placeholder="z. B. Tauscht am liebsten Bücher & Pflanzen" />
      </label>
      <label style={styles.label}>
        Über mich
        <textarea className="mc-input" style={{ ...styles.input, minHeight: 60, resize: "vertical" }} value={bio} maxLength={200} onChange={(e) => setBio(e.target.value)} placeholder="Ein, zwei Sätze über dich" />
      </label>
      <button type="button" className="mc-btn" style={styles.primaryBtn} disabled={saving}
        onClick={() => onSave({ avatar, accent_color: accentColor, motto: motto.trim(), bio: bio.trim() })}>
        {saving ? "Wird gespeichert…" : "Profil speichern"}
      </button>
    </div>
  );
}

function Inbox({ conversations, userId, replyDrafts, onDraftChange, onReply, replySendingKey }) {
  if (conversations.length === 0) return <div style={styles.inboxEmpty}>Noch keine Nachrichten.</div>;
  return (
    <div>
      {conversations.map((conv) => (
        <div key={conv.key} style={styles.convBox}>
          <div style={styles.convHead}>Mit <b>{conv.partnerName}</b>{conv.itemTitle ? <> zu "{conv.itemTitle}"</> : ""}</div>
          <div style={styles.convMessages}>
            {conv.messages.map((m) => (
              <div key={m.id} style={{ ...styles.bubble, ...(m.from_id === userId ? styles.bubbleMine : styles.bubbleTheirs) }}>
                <div style={styles.bubbleAuthor}>{m.from_id === userId ? "Du" : conv.partnerName}</div>
                {m.text}
              </div>
            ))}
          </div>
          <div style={styles.convReplyRow}>
            <input className="mc-input" style={{ ...styles.input, flex: 1 }} placeholder="Antworten…"
              value={replyDrafts[conv.key] || ""} onChange={(e) => onDraftChange(conv.key, e.target.value)} />
            <button style={styles.smallBtn} disabled={!(replyDrafts[conv.key] || "").trim() || replySendingKey === conv.key} onClick={() => onReply(conv)}>
              {replySendingKey === conv.key ? "…" : "Senden"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profilesById, setProfilesById] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", displayName: "" });
  const [authError, setAuthError] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [listings, setListings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [tradeOffers, setTradeOffers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySendingKey, setReplySendingKey] = useState(null);

  const [catFilter, setCatFilter] = useState("alle");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "sache", description: "", priceEuro: "", hourlyRateEuro: "", hours: "", shippingEuro: "", location: "Traun" });
  const [saving, setSaving] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [ratingSubmittingId, setRatingSubmittingId] = useState(null);
  const [tradeFormItemId, setTradeFormItemId] = useState(null);
  const [tradeSubmittingId, setTradeSubmittingId] = useState(null);
  const [tradeActionId, setTradeActionId] = useState(null);
  const [msgFormItemId, setMsgFormItemId] = useState(null);
  const [msgSubmittingId, setMsgSubmittingId] = useState(null);

  const enrichListing = useCallback((row, pMap) => {
    const owner = pMap[row.owner_id] || {};
    return { ...row, owner_display_name: owner.display_name || "Unbekannt", owner_avatar: owner.avatar, owner_accent_color: owner.accent_color };
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: profs }, { data: lst }, { data: rts }, { data: offs }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("listings").select("*").order("created_at", { ascending: false }),
        supabase.from("ratings").select("*"),
        supabase.from("trade_offers").select("*"),
      ]);
      const pMap = {};
      (profs || []).forEach((p) => { pMap[p.id] = p; });
      setProfilesById(pMap);
      setListings((lst || []).map((l) => enrichListing(l, pMap)));
      setRatings(rts || []);
      setTradeOffers(offs || []);
    } catch (e) {
      setError("Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [enrichListing]);

  const fetchMessages = useCallback(async (userId) => {
    if (!userId) return;
    const { data } = await supabase.from("messages").select("*").or(`from_id.eq.${userId},to_id.eq.${userId}`).order("created_at", { ascending: true });
    setMessages(data || []);
  }, []);

  useEffect(() => {
    fetchAll();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadOwnProfile(session.user.id);
        fetchMessages(session.user.id);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        loadOwnProfile(s.user.id);
        fetchMessages(s.user.id);
      } else {
        setProfile(null);
        setMessages([]);
      }
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOwnProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  }

  const isAdmin = session && ADMIN_EMAILS.includes(session.user.email);
  const openReports = useMemo(() => ratings.filter((r) => r.stars === 1 && !r.resolved), [ratings]);

  const myAvailableListings = useMemo(() => {
    if (!session) return [];
    return listings.filter((l) => l.owner_id === session.user.id && l.status === "verfuegbar");
  }, [listings, session]);

  const incomingOffers = useMemo(() => {
    if (!session) return [];
    return tradeOffers.filter((o) => o.target_owner_id === session.user.id && o.status === "offen")
      .map((o) => ({ ...o, offerer_name: profilesById[o.offerer_id]?.display_name, target_item_title: listings.find((l) => l.id === o.target_item_id)?.title, offered_listing_title: listings.find((l) => l.id === o.offered_listing_id)?.title }));
  }, [tradeOffers, session, profilesById, listings]);
  const outgoingOffers = useMemo(() => {
    if (!session) return [];
    return tradeOffers.filter((o) => o.offerer_id === session.user.id && o.status !== "abgelehnt")
      .map((o) => ({ ...o, target_owner_name: profilesById[o.target_owner_id]?.display_name, target_item_title: listings.find((l) => l.id === o.target_item_id)?.title, offered_listing_title: listings.find((l) => l.id === o.offered_listing_id)?.title }));
  }, [tradeOffers, session, profilesById, listings]);

  const myConversations = useMemo(() => {
    if (!session) return [];
    const groups = {};
    messages.forEach((m) => {
      const key = m.conv_key;
      if (!groups[key]) {
        const partnerId = m.from_id === session.user.id ? m.to_id : m.from_id;
        groups[key] = { key, partnerId, partnerName: profilesById[partnerId]?.display_name || "?", itemId: m.item_id, itemTitle: m.item_title, messages: [] };
      }
      groups[key].messages.push(m);
    });
    return Object.values(groups).sort((a, b) => b.messages[b.messages.length - 1].created_at.localeCompare(a.messages[a.messages.length - 1].created_at));
  }, [messages, session, profilesById]);

  const unreadCount = useMemo(() => {
    if (!session) return 0;
    return messages.filter((m) => m.to_id === session.user.id && !m.read).length;
  }, [messages, session]);

  async function markInboxRead() {
    if (!session) return;
    const unread = messages.filter((m) => m.to_id === session.user.id && !m.read);
    if (unread.length === 0) return;
    await supabase.from("messages").update({ read: true }).in("id", unread.map((m) => m.id));
    setMessages((prev) => prev.map((m) => (m.to_id === session.user.id ? { ...m, read: true } : m)));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    const { email, password, displayName } = authForm;
    if (!email.trim() || !password || !displayName.trim()) { setAuthError("Bitte alle Felder ausfüllen."); return; }
    setAuthBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) { setAuthError(signUpError.message); setAuthBusy(false); return; }
      if (data.user) {
        await supabase.from("profiles").insert({ id: data.user.id, display_name: displayName.trim(), balance: 0 });
      }
      if (!data.session) {
        setAuthInfo("Fast fertig! Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben, und melde dich danach an.");
      }
      await fetchAll();
    } catch (e) {
      setAuthError("Registrierung fehlgeschlagen. Bitte nochmal versuchen.");
    } finally { setAuthBusy(false); }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    const { email, password } = authForm;
    if (!email.trim() || !password) { setAuthError("Bitte E-Mail und Passwort eingeben."); return; }
    setAuthBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) { setAuthError(signInError.message); setAuthBusy(false); return; }
    } catch (e) {
      setAuthError("Anmeldung fehlgeschlagen. Bitte nochmal versuchen.");
    } finally { setAuthBusy(false); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setShowProfile(false);
    setShowInbox(false);
  }

  async function saveProfile(newProfile) {
    if (!session) return;
    setProfileSaving(true);
    setError(null);
    try {
      const { error: updErr } = await supabase.from("profiles").update(newProfile).eq("id", session.user.id);
      if (updErr) throw updErr;
      setProfile((p) => ({ ...p, ...newProfile }));
      setShowProfile(false);
      fetchAll();
    } catch (e) {
      setError("Profil konnte nicht gespeichert werden.");
    } finally { setProfileSaving(false); }
  }

  const categoryAverage = useMemo(() => {
    const same = listings.filter((l) => l.category === form.category);
    if (same.length === 0) return null;
    return Math.round(same.reduce((s, l) => s + l.price, 0) / same.length);
  }, [listings, form.category]);

  const computedPawsPreview = useMemo(() => {
    if (form.category === "dienstleistung") {
      const rate = Number(form.hourlyRateEuro); const hrs = Number(form.hours);
      if (!rate || !hrs) return null;
      return euroToPaws(rate * hrs);
    }
    const euro = Number(form.priceEuro);
    if (!euro) return null;
    return euroToPaws(euro);
  }, [form.category, form.hourlyRateEuro, form.hours, form.priceEuro]);

  const shippingPreview = useMemo(() => {
    if (!catInfo(form.category).physical) return 0;
    const euro = Number(form.shippingEuro);
    if (!euro) return 0;
    return euroToPaws(euro);
  }, [form.category, form.shippingEuro]);

  async function submitListing(e) {
    e.preventDefault();
    if (!session) return;
    if (!form.title.trim() || !form.description.trim()) { setError("Bitte Titel und Beschreibung ausfüllen."); return; }
    let price = 0, extra = {};
    if (form.category === "dienstleistung") {
      const rate = Number(form.hourlyRateEuro); const hrs = Number(form.hours);
      if (!rate || !hrs) { setError("Bitte Stundensatz und geschätzte Stunden angeben."); return; }
      price = euroToPaws(rate * hrs);
      extra = { hourly_rate_euro: rate, hours: hrs };
    } else {
      const euro = Number(form.priceEuro);
      if (!euro) { setError("Bitte einen Preis in Euro angeben."); return; }
      price = euroToPaws(euro);
      extra = { price_euro: euro };
    }
    const shippingPaws = catInfo(form.category).physical ? euroToPaws(form.shippingEuro || 0) : 0;

    setSaving(true);
    setError(null);
    try {
      const code = String(listings.length + 1).padStart(4, "0");
      const { error: insErr } = await supabase.from("listings").insert({
        code, title: form.title.trim(), category: form.category, description: form.description.trim(),
        price, shipping_paws: shippingPaws, location: form.location.trim() || "Traun",
        owner_id: session.user.id, status: "verfuegbar", ...extra,
      });
      if (insErr) throw insErr;

      const newBalance = (profile?.balance || 0) + price;
      const { error: balErr } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", session.user.id);
      if (balErr) throw balErr;
      setProfile((p) => ({ ...p, balance: newBalance }));

      setForm({ title: "", category: "sache", description: "", priceEuro: "", hourlyRateEuro: "", hours: "", shippingEuro: "", location: "Traun" });
      setShowForm(false);
      fetchAll();
    } catch (e) {
      setError("Angebot konnte nicht gespeichert werden. Bitte nochmal versuchen.");
    } finally { setSaving(false); }
  }

  async function deleteListing(id) {
    try {
      const { error: delErr } = await supabase.from("listings").delete().eq("id", id);
      if (delErr) throw delErr;
      fetchAll();
    } catch (e) { setError("Zettel konnte nicht abgehängt werden."); }
  }

  async function requestItem(item) {
    if (!session || item.owner_id === session.user.id) return;
    setRequestingId(item.id);
    setError(null);
    try {
      const total = item.price + (item.shipping_paws || 0);
      if ((profile?.balance || 0) < total) { setError("Du hast nicht genug " + CURRENCY + " für dieses Angebot inkl. Versand."); setRequestingId(null); return; }

      const { error: listErr } = await supabase.from("listings").update({ status: "vergeben", buyer_id: session.user.id }).eq("id", item.id);
      if (listErr) throw listErr;

      const newBuyerBalance = profile.balance - total;
      await supabase.from("profiles").update({ balance: newBuyerBalance }).eq("id", session.user.id);
      setProfile((p) => ({ ...p, balance: newBuyerBalance }));

      if (item.shipping_paws > 0) {
        const seller = profilesById[item.owner_id];
        const newSellerBalance = (seller?.balance || 0) + item.shipping_paws;
        await supabase.from("profiles").update({ balance: newSellerBalance }).eq("id", item.owner_id);
      }
      fetchAll();
    } catch (e) {
      setError("Anfordern hat nicht geklappt. Bitte nochmal versuchen.");
    } finally { setRequestingId(null); }
  }

  async function submitRating(item, stars, comment) {
    if (!session) return;
    setRatingSubmittingId(item.id);
    setError(null);
    try {
      const { error: insErr } = await supabase.from("ratings").insert({
        item_id: item.id, item_title: item.title, rated_id: item.owner_id, by_id: session.user.id,
        stars, comment: comment.trim(),
      });
      if (insErr) throw insErr;
      fetchAll();
    } catch (e) {
      setError("Bewertung konnte nicht gespeichert werden.");
    } finally { setRatingSubmittingId(null); }
  }

  async function blockUser(report) {
    try {
      await supabase.from("profiles").update({ blocked: true }).eq("id", report.rated_id);
      await supabase.from("ratings").update({ resolved: true }).eq("id", report.id);
      fetchAll();
    } catch (e) { setError("Konnte Nutzer nicht sperren."); }
  }
  async function dismissReport(report) {
    try {
      await supabase.from("ratings").update({ resolved: true }).eq("id", report.id);
      fetchAll();
    } catch (e) { setError("Meldung konnte nicht bearbeitet werden."); }
  }

  function toggleTradeForm(id) { setTradeFormItemId((c) => (c === id ? null : id)); setMsgFormItemId(null); }
  function toggleMsgForm(id) { setMsgFormItemId((c) => (c === id ? null : id)); setTradeFormItemId(null); }

  async function submitTradeOffer(targetItem, offeredListingId, message) {
    if (!session) return;
    setTradeSubmittingId(targetItem.id);
    setError(null);
    try {
      const { error: insErr } = await supabase.from("trade_offers").insert({
        target_item_id: targetItem.id, offered_listing_id: offeredListingId,
        target_owner_id: targetItem.owner_id, offerer_id: session.user.id, message: message.trim(),
      });
      if (insErr) throw insErr;
      setTradeFormItemId(null);
      fetchAll();
    } catch (e) {
      setError("Tauschangebot konnte nicht gesendet werden.");
    } finally { setTradeSubmittingId(null); }
  }

  async function acceptTradeOffer(offer) {
    setTradeActionId(offer.id);
    setError(null);
    try {
      await supabase.from("listings").update({ status: "vergeben", buyer_id: offer.offerer_id, traded_for: offer.offered_listing_title }).eq("id", offer.target_item_id);
      await supabase.from("listings").update({ status: "vergeben", buyer_id: offer.target_owner_id, traded_for: offer.target_item_title }).eq("id", offer.offered_listing_id);
      await supabase.from("trade_offers").update({ status: "angenommen" }).eq("id", offer.id);
      fetchAll();
    } catch (e) {
      setError("Tauschangebot konnte nicht angenommen werden.");
    } finally { setTradeActionId(null); }
  }
  async function declineTradeOffer(offer) {
    setTradeActionId(offer.id);
    setError(null);
    try {
      await supabase.from("trade_offers").update({ status: "abgelehnt" }).eq("id", offer.id);
      fetchAll();
    } catch (e) {
      setError("Tauschangebot konnte nicht abgelehnt werden.");
    } finally { setTradeActionId(null); }
  }

  async function submitMessage(item, text) {
    if (!session) return;
    setMsgSubmittingId(item.id);
    setError(null);
    try {
      const { error: insErr } = await supabase.from("messages").insert({
        conv_key: convKey(session.user.id, item.owner_id, item.id),
        from_id: session.user.id, to_id: item.owner_id, item_id: item.id, item_title: item.title, text: text.trim(),
      });
      if (insErr) throw insErr;
      setMsgFormItemId(null);
      fetchMessages(session.user.id);
    } catch (e) {
      setError("Nachricht konnte nicht gesendet werden.");
    } finally { setMsgSubmittingId(null); }
  }

  function updateReplyDraft(key, value) { setReplyDrafts((d) => ({ ...d, [key]: value })); }

  async function sendReply(conv) {
    if (!session) return;
    const text = (replyDrafts[conv.key] || "").trim();
    if (!text) return;
    setReplySendingKey(conv.key);
    setError(null);
    try {
      const { error: insErr } = await supabase.from("messages").insert({
        conv_key: conv.key, from_id: session.user.id, to_id: conv.partnerId, item_id: conv.itemId, item_title: conv.itemTitle, text,
      });
      if (insErr) throw insErr;
      updateReplyDraft(conv.key, "");
      fetchMessages(session.user.id);
    } catch (e) {
      setError("Antwort konnte nicht gesendet werden.");
    } finally { setReplySendingKey(null); }
  }

  const visible = listings.filter((l) => {
    const matchesCat = catFilter === "alle" || l.category === catFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::selection { background: ${COLORS.lime}; color: ${COLORS.ink}; }
        .mc-btn { transition: transform .15s ease, box-shadow .15s ease; }
        .mc-btn:hover { transform: translateY(-2px); }
        .mc-btn:focus-visible, .mc-input:focus-visible, .mc-tab:focus-visible { outline: 3px solid ${COLORS.lime}; outline-offset: 2px; }
        .mc-ticket { transition: transform .18s ease, box-shadow .18s ease; }
        .mc-ticket:hover { transform: translateY(-3px); box-shadow: 0 14px 0 ${COLORS.ink}; }
        @media (prefers-reduced-motion: reduce) { .mc-btn, .mc-ticket { transition: none !important; } .mc-btn:hover, .mc-ticket:hover { transform: none !important; } }
        .mc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 22px; }
        @media (max-width: 560px) { .mc-hero-title { font-size: 38px !important; } }
      `}</style>

      <header style={styles.header}>
        <div style={styles.logo}>MantyCat</div>
        <div style={styles.headerRight}>
          {session && profile ? (
            <span style={styles.whoami}>
              {isAdmin && <span style={styles.reportPill}>Meldungen {openReports.length > 0 ? `(${openReports.length})` : ""}</span>}
              {incomingOffers.length > 0 && <span style={styles.tradePill}>Tauschanfragen ({incomingOffers.length})</span>}
              <button style={styles.msgPillBtn} onClick={() => { setShowInbox((s) => !s); if (!showInbox) markInboxRead(); }}>
                Nachrichten {unreadCount > 0 ? `(${unreadCount})` : ""}
              </button>
              {profile.avatar && <span style={{ fontSize: 16 }}>{profile.avatar}</span>}
              <b>{profile.display_name}</b>
              <span style={styles.balancePill}><PawCoin size={16} /> {profile.balance ?? "…"}</span>
              <button style={styles.logoutLink} onClick={() => setShowProfile((s) => !s)}>profil</button>
              <button style={styles.logoutLink} onClick={handleLogout}>abmelden</button>
            </span>
          ) : (
            <span style={styles.whoami}>nicht angemeldet</span>
          )}
        </div>
      </header>

      <section style={styles.hero}>
        <div style={styles.heroEyebrow}>AUS TRAUN, FÜR ALLE</div>
        <h1 className="mc-hero-title" style={styles.heroTitle}>Tauschen mit<br />{CURRENCY}.</h1>
        <p style={styles.heroSub}>Du bekommst {CURRENCY}, wenn du selbst etwas einstellst, und gibst sie aus, um andere Angebote zu holen. Keine Paws übrig? Biete stattdessen direkt eines deiner Angebote zum Tausch an.</p>
        <a href="#angebote" className="mc-btn" style={styles.heroCta}>Zettel durchstöbern ↓</a>
      </section>

      {!session && (
        <section style={styles.authBox}>
          <div style={styles.authTabs}>
            <button style={{ ...styles.authTab, ...(authMode === "login" ? styles.authTabActive : {}) }} onClick={() => { setAuthMode("login"); setAuthError(null); setAuthInfo(null); }}>Anmelden</button>
            <button style={{ ...styles.authTab, ...(authMode === "register" ? styles.authTabActive : {}) }} onClick={() => { setAuthMode("register"); setAuthError(null); setAuthInfo(null); }}>Konto anlegen</button>
          </div>
          <form onSubmit={authMode === "login" ? handleLogin : handleRegister} style={styles.authForm}>
            {authMode === "register" && (
              <label style={styles.label}>
                Anzeigename
                <input className="mc-input" style={styles.input} value={authForm.displayName} onChange={(e) => setAuthForm({ ...authForm, displayName: e.target.value })} placeholder="z. B. Anna aus Traun" />
              </label>
            )}
            <label style={styles.label}>
              E-Mail
              <input className="mc-input" style={styles.input} type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="du@beispiel.at" />
            </label>
            <label style={styles.label}>
              Passwort
              <input className="mc-input" style={styles.input} type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
            </label>
            {authError && <div style={styles.authError}>{authError}</div>}
            {authInfo && <div style={styles.authInfo}>{authInfo}</div>}
            <button type="submit" className="mc-btn" style={styles.primaryBtn} disabled={authBusy}>
              {authBusy ? "Einen Moment…" : authMode === "login" ? "Anmelden" : "Konto anlegen"}
            </button>
          </form>
        </section>
      )}

      {session && showProfile && profile && (
        <section style={styles.profileBox}>
          <h2 style={styles.profileTitle}>Dein Profil</h2>
          <ProfileEditor profile={profile} onSave={saveProfile} saving={profileSaving} />
        </section>
      )}

      {session && showInbox && (
        <section style={styles.inboxBox}>
          <h2 style={styles.profileTitle}>Nachrichten</h2>
          <Inbox conversations={myConversations} userId={session.user.id} replyDrafts={replyDrafts} onDraftChange={updateReplyDraft} onReply={sendReply} replySendingKey={replySendingKey} />
        </section>
      )}

      {error && (
        <div style={styles.errorBar}>
          {error}
          <button style={styles.errorClose} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {isAdmin && openReports.length > 0 && (
        <section style={styles.adminBox}>
          <h2 style={styles.adminTitle}>Meldungen (1-Stern-Bewertungen)</h2>
          {openReports.map((r) => (
            <div key={r.id} style={styles.reportRow}>
              <div><b>{profilesById[r.rated_id]?.display_name}</b> wurde von <b>{profilesById[r.by_id]?.display_name}</b> mit 1 Stern bewertet{r.comment ? <>: "{r.comment}"</> : "."} (Angebot: {r.item_title})</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button style={styles.smallBtnRust} onClick={() => blockUser(r)}>Nutzer sperren</button>
                <button style={styles.smallBtnGhost} onClick={() => dismissReport(r)}>Ignorieren</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {session && (incomingOffers.length > 0 || outgoingOffers.length > 0) && (
        <section style={styles.tradeSection}>
          <h2 style={styles.tradeSectionTitle}>Tauschanfragen</h2>
          {incomingOffers.length > 0 && (
            <>
              <div style={styles.tradeSubhead}>An dich</div>
              {incomingOffers.map((o) => (
                <div key={o.id} style={styles.tradeRow}>
                  <div><b>{o.offerer_name}</b> bietet <b>{o.offered_listing_title}</b> im Tausch für dein <b>{o.target_item_title}</b>{o.message ? <> — "{o.message}"</> : ""}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button style={styles.smallBtn} disabled={tradeActionId === o.id} onClick={() => acceptTradeOffer(o)}>Annehmen</button>
                    <button style={styles.smallBtnGhostInk} disabled={tradeActionId === o.id} onClick={() => declineTradeOffer(o)}>Ablehnen</button>
                  </div>
                </div>
              ))}
            </>
          )}
          {outgoingOffers.length > 0 && (
            <>
              <div style={styles.tradeSubhead}>Von dir gestellt</div>
              {outgoingOffers.map((o) => (
                <div key={o.id} style={styles.tradeRow}>Du bietest <b>{o.offered_listing_title}</b> für <b>{o.target_item_title}</b> bei {o.target_owner_name} — Status: {o.status}</div>
              ))}
            </>
          )}
        </section>
      )}

      <section id="angebote" style={styles.board}>
        <div style={styles.boardHead}>
          <h2 style={styles.boardTitle}>Das Schwarze Brett</h2>
          {session && (
            <button className="mc-btn" style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "+ Zettel aufhängen"}</button>
          )}
        </div>

        <input className="mc-input" style={styles.searchInput} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suchen, z. B. Bohrmaschine, Nachhilfe, Aquarium…" />

        <div style={styles.filterLabel}>Kategorie</div>
        <div style={styles.tabs}>
          {["alle", ...CATS.map((c) => c.id)].map((f) => (
            <button key={f} className="mc-tab" onClick={() => setCatFilter(f)} style={{ ...styles.tab, ...(catFilter === f ? styles.tabActive : {}) }}>{f === "alle" ? "Alle" : catInfo(f).label}</button>
          ))}
        </div>

        {showForm && session && (
          <form onSubmit={submitListing} style={styles.form}>
            <div style={styles.formRow}>
              <label style={styles.label}>
                Titel
                <input className="mc-input" style={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="z. B. Bohrmaschine, Nachhilfe Mathe, Website-Beratung" />
              </label>
              <label style={styles.label}>
                Kategorie
                <select className="mc-input" style={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
            </div>
            {form.category === "hobby" && (
              <div style={styles.hobbyHint}>Diese Kategorie ist für Dinge gedacht, die man nur eine Weile ausprobieren möchte, bevor man sie kauft, ideal zum Reinschnuppern in neue Hobbys.</div>
            )}
            <label style={styles.label}>
              Beschreibung
              <textarea className="mc-input" style={{ ...styles.input, minHeight: 70, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Zustand, Umfang, worauf es ankommt" />
            </label>
            {form.category === "dienstleistung" ? (
              <div style={styles.formRow}>
                <label style={styles.label}>
                  Stundensatz in Euro
                  <input className="mc-input" style={styles.input} type="number" min="0" value={form.hourlyRateEuro} onChange={(e) => setForm({ ...form, hourlyRateEuro: e.target.value })} placeholder="z. B. 25" />
                </label>
                <label style={styles.label}>
                  Geschätzte Stunden
                  <input className="mc-input" style={styles.input} type="number" min="0" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="z. B. 2" />
                </label>
              </div>
            ) : (
              <label style={styles.label}>
                Preis in Euro
                <input className="mc-input" style={styles.input} type="number" min="0" value={form.priceEuro} onChange={(e) => setForm({ ...form, priceEuro: e.target.value })} placeholder="ungefährer Wert" />
              </label>
            )}
            {catInfo(form.category).physical && (
              <label style={styles.label}>
                Versandkosten in Euro (zahlt Empfänger:in in {CURRENCY})
                <input className="mc-input" style={styles.input} type="number" min="0" value={form.shippingEuro} onChange={(e) => setForm({ ...form, shippingEuro: e.target.value })} placeholder="z. B. 5, oder leer bei Selbstabholung" />
              </label>
            )}
            <div style={styles.valueHint}>
              Faustregel: 1 {CURRENCY_SINGULAR} = {EURO_TO_PAW} €.
              {computedPawsPreview !== null && <> Das ergibt aktuell <b>{computedPawsPreview} {computedPawsPreview === 1 ? CURRENCY_SINGULAR : CURRENCY}</b>{shippingPreview > 0 && <> + {shippingPreview} {CURRENCY} Versand</>}.</>}
              {categoryAverage !== null && <> Ähnliche Angebote in "{catInfo(form.category).label}" liegen im Schnitt bei {categoryAverage} {categoryAverage === 1 ? CURRENCY_SINGULAR : CURRENCY}.</>}
            </div>
            <label style={styles.label}>
              Standort
              <input className="mc-input" style={styles.input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </label>
            <button type="submit" className="mc-btn" style={styles.primaryBtn} disabled={saving}>{saving ? "Wird aufgehängt…" : "Zettel aufhängen"}</button>
          </form>
        )}

        {loading ? (
          <div style={styles.empty}>Zettel werden geladen…</div>
        ) : visible.length === 0 ? (
          <div style={styles.empty}>{listings.length === 0 ? "Noch nichts hier. Häng den ersten Zettel auf." : "Nichts gefunden. Anderen Suchbegriff oder Filter probieren."}</div>
        ) : (
          <div className="mc-grid">
            {visible.map((item) => {
              const alreadyRated = ratings.some((r) => r.item_id === item.id && r.by_id === session?.user.id);
              const showRating = session && item.status === "vergeben" && item.buyer_id === session.user.id && !alreadyRated;
              return (
                <div className="mc-ticket" key={item.id}>
                  <TicketCard
                    item={item}
                    isMine={session && item.owner_id === session.user.id}
                    canAfford={session && profile && profile.balance >= item.price + (item.shipping_paws || 0)}
                    onDelete={deleteListing}
                    onRequest={requestItem}
                    requesting={requestingId === item.id}
                    showRating={showRating}
                    onRate={submitRating}
                    ratingSubmitting={ratingSubmittingId === item.id}
                    myListings={myAvailableListings}
                    tradeFormOpen={tradeFormItemId === item.id}
                    onToggleTradeForm={toggleTradeForm}
                    onSubmitTrade={submitTradeOffer}
                    tradeSubmitting={tradeSubmittingId === item.id}
                    msgFormOpen={msgFormItemId === item.id}
                    onToggleMsgForm={toggleMsgForm}
                    onSubmitMessage={submitMessage}
                    msgSubmitting={msgSubmittingId === item.id}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer style={styles.footer}>MantyCat, ein Tauschbrett aus Traun. {CURRENCY} sind eine reine Verrechnungswährung ohne echten Geldwert.</footer>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Inter', sans-serif", background: COLORS.paper, color: COLORS.ink, minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: `2px solid ${COLORS.ink}`, background: COLORS.paper, position: "sticky", top: 0, zIndex: 5 },
  logo: { fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em" },
  headerRight: { fontSize: 13, color: COLORS.mossDark },
  whoami: { fontFamily: "'IBM Plex Mono', monospace", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  balancePill: { display: "inline-flex", alignItems: "center", gap: 4, background: COLORS.paper, border: `1.5px solid ${COLORS.ink}`, borderRadius: 20, padding: "2px 10px 2px 6px", fontWeight: 600 },
  reportPill: { background: COLORS.rust, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11 },
  tradePill: { background: COLORS.moss, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11 },
  msgPillBtn: { background: "transparent", color: COLORS.ink, border: `1.5px solid ${COLORS.ink}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" },
  logoutLink: { background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.rust },
  hero: { background: COLORS.moss, color: COLORS.paper, padding: "64px 28px 56px", textAlign: "center" },
  heroEyebrow: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: "0.18em", color: COLORS.lime, marginBottom: 18 },
  heroTitle: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 54, lineHeight: 1.05, margin: "0 0 18px" },
  heroSub: { maxWidth: 480, margin: "0 auto 28px", fontSize: 16, lineHeight: 1.5, color: COLORS.stone },
  heroCta: { display: "inline-block", background: COLORS.lime, color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 14, padding: "14px 26px", borderRadius: 4, textDecoration: "none", boxShadow: `0 5px 0 ${COLORS.ink}`, cursor: "pointer" },
  authBox: { maxWidth: 480, margin: "-28px auto 0", background: COLORS.paper, border: `2px solid ${COLORS.ink}`, borderRadius: 6, padding: "18px 20px 20px", boxShadow: `0 6px 0 ${COLORS.ink}`, position: "relative", zIndex: 2 },
  authTabs: { display: "flex", gap: 6, marginBottom: 14 },
  authTab: { flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, padding: "8px 10px", border: `1.5px solid ${COLORS.ink}`, background: "transparent", cursor: "pointer", borderRadius: 5 },
  authTabActive: { background: COLORS.ink, color: COLORS.paper },
  authForm: { display: "flex", flexDirection: "column", gap: 12 },
  authError: { fontSize: 13, color: COLORS.rust },
  authInfo: { fontSize: 13, color: COLORS.mossDark },
  profileBox: { maxWidth: 480, margin: "-28px auto 0", background: "#fff", border: `2px solid ${COLORS.ink}`, borderRadius: 6, padding: "18px 20px 20px", boxShadow: `0 6px 0 ${COLORS.ink}`, position: "relative", zIndex: 2 },
  profileTitle: { fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 12px" },
  profileForm: { display: "flex", flexDirection: "column", gap: 12 },
  avatarRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  avatarBtn: { fontSize: 20, background: COLORS.paper, border: `1.5px solid ${COLORS.stone}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" },
  avatarBtnActive: { border: `1.5px solid ${COLORS.ink}`, background: COLORS.lime },
  colorRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  colorSwatch: { width: 26, height: 26, borderRadius: "50%", border: `2px solid ${COLORS.paper}`, cursor: "pointer", boxShadow: `0 0 0 1px ${COLORS.stone}` },
  colorSwatchActive: { boxShadow: `0 0 0 2px ${COLORS.ink}` },
  inboxBox: { maxWidth: 640, margin: "-28px auto 0", background: "#fff", border: `2px solid ${COLORS.ink}`, borderRadius: 6, padding: "18px 20px 20px", boxShadow: `0 6px 0 ${COLORS.ink}`, position: "relative", zIndex: 2 },
  inboxEmpty: { fontSize: 13, color: COLORS.mossDark },
  convBox: { border: `1.5px solid ${COLORS.stone}`, borderRadius: 8, padding: 12, marginBottom: 12 },
  convHead: { fontSize: 12.5, color: COLORS.mossDark, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" },
  convMessages: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 },
  bubble: { padding: "8px 10px", borderRadius: 8, fontSize: 13.5, maxWidth: "85%" },
  bubbleMine: { background: COLORS.lime, alignSelf: "flex-end", marginLeft: "auto" },
  bubbleTheirs: { background: COLORS.paper, border: `1px solid ${COLORS.stone}` },
  bubbleAuthor: { fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.mossDark, marginBottom: 2 },
  convReplyRow: { display: "flex", gap: 8 },
  errorBar: { maxWidth: 700, margin: "20px auto 0", background: "#FCE9E1", border: `1px solid ${COLORS.rust}`, color: COLORS.rust, borderRadius: 6, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 },
  errorClose: { background: "none", border: "none", color: COLORS.rust, fontSize: 18, cursor: "pointer", lineHeight: 1 },
  adminBox: { maxWidth: 700, margin: "24px auto 0", background: "#FCE9E1", border: `2px solid ${COLORS.rust}`, borderRadius: 8, padding: "16px 18px" },
  adminTitle: { fontFamily: "'Fraunces', serif", fontSize: 18, margin: "0 0 10px", color: COLORS.rust },
  reportRow: { padding: "10px 0", borderTop: `1px solid ${COLORS.rust}55`, fontSize: 13.5, lineHeight: 1.5 },
  smallBtnRust: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, background: COLORS.rust, color: "#fff", border: "none", borderRadius: 5, padding: "6px 12px", cursor: "pointer" },
  smallBtnGhost: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, background: "transparent", color: COLORS.rust, border: `1px solid ${COLORS.rust}`, borderRadius: 5, padding: "6px 12px", cursor: "pointer" },
  smallBtnGhostInk: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, background: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.ink}`, borderRadius: 5, padding: "7px 14px", cursor: "pointer" },
  tradeSection: { maxWidth: 700, margin: "24px auto 0", background: "#fff", border: `2px solid ${COLORS.moss}`, borderRadius: 8, padding: "16px 18px" },
  tradeSectionTitle: { fontFamily: "'Fraunces', serif", fontSize: 18, margin: "0 0 10px", color: COLORS.moss },
  tradeSubhead: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: COLORS.mossDark, marginTop: 12, marginBottom: 4 },
  tradeRow: { padding: "10px 0", borderTop: `1px solid ${COLORS.stone}`, fontSize: 13.5, lineHeight: 1.5 },
  board: { maxWidth: 1000, margin: "0 auto", padding: "40px 28px 40px" },
  boardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 18 },
  boardTitle: { fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, margin: 0 },
  searchInput: { width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 15, padding: "12px 14px", border: `1.5px solid ${COLORS.ink}`, borderRadius: 6, background: "#fff", marginBottom: 20 },
  filterLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color: COLORS.mossDark, marginBottom: 8 },
  tabs: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  tab: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${COLORS.ink}`, background: "transparent", cursor: "pointer" },
  tabActive: { background: COLORS.ink, color: COLORS.paper },
  form: { background: "#fff", border: `2px solid ${COLORS.ink}`, borderRadius: 8, padding: 22, marginBottom: 34, display: "flex", flexDirection: "column", gap: 14, boxShadow: `0 6px 0 ${COLORS.ink}` },
  formRow: { display: "flex", gap: 14, flexWrap: "wrap" },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 500, flex: 1, minWidth: 180 },
  input: { fontFamily: "'Inter', sans-serif", fontSize: 14, padding: "10px 12px", border: `1.5px solid ${COLORS.stone}`, borderRadius: 5, background: COLORS.paper },
  hobbyHint: { fontSize: 12.5, background: COLORS.paper, border: `1px dashed ${COLORS.moss}`, borderRadius: 6, padding: "10px 12px", color: COLORS.mossDark },
  valueHint: { fontSize: 12.5, color: COLORS.mossDark, lineHeight: 1.5, background: COLORS.paper, border: `1.5px solid ${COLORS.stone}`, borderRadius: 6, padding: "10px 12px" },
  primaryBtn: { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 14, background: COLORS.lime, color: COLORS.ink, border: `2px solid ${COLORS.ink}`, borderRadius: 5, padding: "10px 18px", cursor: "pointer", alignSelf: "flex-start" },
  smallBtn: { marginTop: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, background: COLORS.ink, color: COLORS.paper, border: "none", borderRadius: 5, padding: "7px 14px", cursor: "pointer" },
  empty: { padding: "40px 20px", textAlign: "center", border: `1.5px dashed ${COLORS.stone}`, borderRadius: 8, color: COLORS.mossDark, fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 },
  ticket: { display: "flex", background: "#fff", border: `2px solid ${COLORS.ink}`, borderRadius: 8, overflow: "hidden", boxShadow: `0 6px 0 ${COLORS.ink}`, height: "100%" },
  ticketMain: { flex: 1, padding: "16px 16px 16px 18px", minWidth: 0, display: "flex", flexDirection: "column" },
  badgeRow: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  catBadge: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: COLORS.mossDark, border: `1px solid ${COLORS.stone}`, padding: "3px 8px", borderRadius: 3 },
  soldBadge: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: "#fff", background: COLORS.rust, padding: "3px 8px", borderRadius: 3 },
  ticketTitle: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, margin: "0 0 8px", lineHeight: 1.2 },
  ticketDesc: { fontSize: 13.5, lineHeight: 1.5, margin: "0 0 10px", color: "#3A3A34" },
  metaLine: { fontSize: 12, color: COLORS.mossDark, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" },
  priceRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 },
  priceValue: { fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: COLORS.moss },
  priceLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.mossDark },
  shippingLine: { fontSize: 11.5, color: COLORS.rust, marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace" },
  deleteLink: { marginTop: "auto", background: "none", border: "none", padding: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: COLORS.rust, textDecoration: "underline", cursor: "pointer", alignSelf: "flex-start" },
  actionRow: { marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 },
  requestBtn: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, background: COLORS.lime, color: COLORS.ink, border: `1.5px solid ${COLORS.ink}`, borderRadius: 5, padding: "8px 12px", cursor: "pointer" },
  requestBtnDisabled: { background: COLORS.stone, color: COLORS.mossDark, cursor: "not-allowed" },
  tradeToggleBtn: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, background: "transparent", color: COLORS.moss, border: `1.5px solid ${COLORS.moss}`, borderRadius: 5, padding: "7px 10px", cursor: "pointer" },
  msgToggleBtn: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, background: "transparent", color: COLORS.ink, border: `1.5px solid ${COLORS.ink}`, borderRadius: 5, padding: "7px 10px", cursor: "pointer" },
  tradeBox: { marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COLORS.stone}`, fontSize: 12.5, color: COLORS.mossDark },
  tradeShippingNote: { marginTop: 8, fontSize: 11.5, color: COLORS.mossDark, fontStyle: "italic" },
  ratingBox: { marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${COLORS.stone}`, display: "flex", flexDirection: "column", gap: 4 },
  ratingLabel: { fontSize: 12, color: COLORS.mossDark },
  ticketStub: { width: 92, borderLeft: `2px dashed ${COLORS.ink}`, background: COLORS.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "10px 6px", position: "relative" },
  hole: { width: 10, height: 10, borderRadius: "50%", background: COLORS.paper, border: `2px solid ${COLORS.ink}` },
  ticketCode: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500, writingMode: "vertical-rl", transform: "rotate(180deg)" },
  ticketAvatar: { fontSize: 16 },
  ticketBy: { fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", writingMode: "vertical-rl", transform: "rotate(180deg)", color: COLORS.mossDark },
  ticketLoc: { fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.rust, writingMode: "vertical-rl", transform: "rotate(180deg)" },
  footer: { textAlign: "center", padding: "28px 20px 40px", fontSize: 12.5, color: COLORS.mossDark, fontFamily: "'IBM Plex Mono', monospace" },
};
