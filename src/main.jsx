import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  WEEK_DAYS,
  DAY_START,
  DAY_END,
  formatDateLabel,
  formatMinutes,
  getAvailabilityCalendar,
  getDayShortLabel,
  normalizeParticipants,
  parseEndTimeToMinutes,
  parseTimeToMinutes,
} from './timeLogic.js';

const SESSION_PREFIX = 'studysync87-session-';
const PARTICIPANT_PREFIX = 'studysync87-participants-';
const RECENT_SESSIONS_KEY = 'studysync87-recent-sessions';
const CREATE_DRAFT_KEY = 'studysync87-create-draft';

function parseSavedJson(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function generateSessionId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }

  return Math.random().toString(36).slice(2, 10);
}

function saveSession(session) {
  localStorage.setItem(`${SESSION_PREFIX}${session.id}`, JSON.stringify(session));
  saveRecentSession(session);
}

function loadSession(sessionId) {
  const saved = localStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
  return parseSavedJson(saved, null);
}

function saveParticipants(sessionId, participants) {
  localStorage.setItem(`${PARTICIPANT_PREFIX}${sessionId}`, JSON.stringify(participants));
}

function loadParticipants(sessionId) {
  const saved = localStorage.getItem(`${PARTICIPANT_PREFIX}${sessionId}`);
  return normalizeParticipants(parseSavedJson(saved, []));
}

function deleteSession(sessionId) {
  const nextSessions = loadRecentSessions().filter((session) => session.id !== sessionId);
  localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(nextSessions));
  localStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
  localStorage.removeItem(`${PARTICIPANT_PREFIX}${sessionId}`);
}

function saveRecentSession(session) {
  const current = loadRecentSessions().filter((savedSession) => savedSession.id !== session.id);
  localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify([session, ...current].slice(0, 12)));
}

function loadRecentSessions() {
  const indexedSessions = parseSavedJson(localStorage.getItem(RECENT_SESSIONS_KEY), []);
  const storedSessions = Object.keys(localStorage)
    .filter((key) => key.startsWith(SESSION_PREFIX))
    .map((key) => {
      return parseSavedJson(localStorage.getItem(key), null);
    })
    .filter((session) => session?.id);

  const uniqueSessions = new Map(
    [...storedSessions, ...indexedSessions]
      .filter((session) => session?.id)
      .map((session) => [session.id, session]),
  );

  return [...uniqueSessions.values()].sort(
    (first, second) => (Date.parse(second.createdAt) || 0) - (Date.parse(first.createdAt) || 0),
  );
}

function loadCreateDraft() {
  const saved = localStorage.getItem(CREATE_DRAFT_KEY);

  return parseSavedJson(saved, {
    title: '',
    startDate: '',
    endDate: '',
    duration: '60',
  });
}

function HomePage({ onCreateSession }) {
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">No sign-up. Link or one shared device.</p>
          <h1>Find the best time for your group to meet</h1>
          <p className="intro">
            Create a session, add everyone's busy times, and StudySync87 shows the
            overlapping free spots in a clear weekly calendar.
          </p>
          <button className="primary-button" onClick={onCreateSession}>
            Create a Session
          </button>
          <div className="participation-cards">
            <article>
              <ChainLinkIcon />
              <span>Share by link</span>
              <p>Participants can add availability from their own device.</p>
            </article>
            <article>
              <DevicesIcon />
              <span>Use one device</span>
              <p>Pass a phone or laptop around and save each person.</p>
            </article>
          </div>
        </div>
        <HeroPreview />
      </section>
    </main>
  );
}

function ChainLinkIcon() {
  return (
    <svg className="card-logo link-logo" viewBox="0 0 120 90" aria-hidden="true">
      <path
        d="M47 56 35 68c-9 9-24-6-15-15l18-18c8-8 19-7 27 1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="12"
      />
      <path
        d="M73 34 85 22c9-9 24 6 15 15L82 55c-8 8-19 7-27-1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="12"
      />
      <path
        d="M45 58 75 28"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="12"
      />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg className="card-logo devices-logo" viewBox="0 0 140 95" aria-hidden="true">
      <rect x="28" y="6" width="84" height="62" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
      <path d="M58 84h24M63 68l-4 16M77 68l4 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <path d="M51 84h38" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <circle cx="70" cy="59" r="3" fill="currentColor" />
      <rect x="6" y="40" width="30" height="47" rx="5" fill="#ffffff" stroke="currentColor" strokeWidth="5" />
      <rect x="104" y="30" width="30" height="57" rx="5" fill="#ffffff" stroke="currentColor" strokeWidth="5" />
      <path d="M17 47h8M115 37h8M18 78h6M116 78h6" stroke="#12c7c4" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

function HeroPreview() {
  return (
    <div className="hero-preview panel">
      <div className="preview-head">
        <strong>Group Planning Session</strong>
        <div className="mini-legend">
          <span className="green" />
          <span className="red" />
        </div>
      </div>
      <div className="mini-calendar" aria-hidden="true">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <b key={day}>{day}</b>
        ))}
        {Array.from({ length: 56 }, (_, index) => (
          <i
            className={index % 11 === 0 ? 'busy' : index % 3 === 0 ? 'free' : ''}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

function CreateSessionPage({ onSessionCreated, onBackHome }) {
  const [form, setForm] = useState(loadCreateDraft);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(CREATE_DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Session title is required.');
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError('Please choose both a start date and an end date.');
      return;
    }

    if (form.endDate < form.startDate) {
      setError('End date must be the same day as or after the start date.');
      return;
    }

    const session = {
      id: generateSessionId(),
      title: form.title.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      duration: Number(form.duration),
      createdAt: new Date().toISOString(),
    };

    saveSession(session);
    localStorage.removeItem(CREATE_DRAFT_KEY);
    onSessionCreated(session.id);
  }

  return (
    <main className="page-shell compact-page">
      <button className="text-button" onClick={onBackHome}>
        Back to home
      </button>
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">New group link</p>
          <h1>Create Session</h1>
          <p>Create the shared page first. Then invite people by link or pass around one device.</p>
        </div>

        <form className="session-form" onSubmit={handleSubmit}>
          <label>
            Session title
            <input name="title" value={form.title} onChange={updateField} placeholder="SEG Lab Project" />
          </label>

          <div className="form-row">
            <label>
              Start date
              <input name="startDate" type="date" value={form.startDate} onChange={updateField} />
            </label>
            <label>
              End date
              <input name="endDate" type="date" value={form.endDate} onChange={updateField} />
            </label>
          </div>

          <label>
            Meeting duration
            <select name="duration" value={form.duration} onChange={updateField}>
              {[30, 60, 90, 120].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          {error && <p className="error-message">{error}</p>}

          <button className="primary-button" type="submit">
            Create session
          </button>
        </form>
      </section>
    </main>
  );
}

function RecentSessionsPage({ onOpenSession, onCreateSession }) {
  const [recentSessions, setRecentSessions] = useState(loadRecentSessions);

  function handleDelete(sessionId) {
    deleteSession(sessionId);
    setRecentSessions(loadRecentSessions());
  }

  return (
    <main className="page-shell compact-page">
      <section className="panel recent-panel">
        <div className="section-heading">
          <p className="eyebrow">Saved in this browser</p>
          <h1>Recent Sessions</h1>
          <p>Open sessions you created on this device. Version 1 still uses localStorage only.</p>
        </div>

        {recentSessions.length === 0 ? (
          <div className="empty-state">
            <p>No sessions have been created in this browser yet.</p>
            <button className="primary-button" onClick={onCreateSession}>
              Create Session
            </button>
          </div>
        ) : (
          <ul className="session-list">
            {recentSessions.map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.title}</strong>
                  <span>
                    {formatDateLabel(session.startDate)} to {formatDateLabel(session.endDate)} -{' '}
                    {session.duration} minutes
                  </span>
                </div>
                <button className="secondary-button" onClick={() => onOpenSession(session.id)}>
                  Open
                </button>
                <button className="danger-button" onClick={() => handleDelete(session.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function SessionPage({ sessionId, onBackHome }) {
  const [session] = useState(() => loadSession(sessionId));
  const [participants, setParticipants] = useState(() => loadParticipants(sessionId));
  const [name, setName] = useState('');
  const [periods, setPeriods] = useState([]);
  const [draftPeriod, setDraftPeriod] = useState({
    day: 'monday',
    start: '09:00',
    end: '10:00',
  });
  const [formError, setFormError] = useState('');
  const [savedName, setSavedName] = useState('');

  const calendarDays = useMemo(() => getAvailabilityCalendar(participants), [participants]);

  function updatePeriodField(event) {
    const { name: fieldName, value } = event.target;
    setDraftPeriod((current) => ({ ...current, [fieldName]: value }));
  }

  function addBusyPeriod() {
    setFormError('');

    const startMinutes = parseTimeToMinutes(draftPeriod.start);
    const endMinutes = parseEndTimeToMinutes(draftPeriod.end);

    if (startMinutes < DAY_START || endMinutes > DAY_END) {
      setFormError('Busy time must be between 7:00 AM and 12:00 AM.');
      return;
    }

    if (endMinutes <= startMinutes) {
      setFormError('Busy time must end after it starts.');
      return;
    }

    setPeriods((current) => [...current, { ...draftPeriod }]);
  }

  function removeBusyPeriod(indexToRemove) {
    setPeriods((current) => current.filter((_, index) => index !== indexToRemove));
  }

  function saveAvailability(event) {
    event.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Participant name is required.');
      return;
    }

    const cleanName = name.trim();
    const nextParticipants = [
      ...participants.filter((participant) => participant.name.toLowerCase() !== cleanName.toLowerCase()),
      { name: cleanName, periods },
    ];

    setParticipants(nextParticipants);
    saveParticipants(sessionId, nextParticipants);
    setSavedName(cleanName);
    setName('');
    setPeriods([]);
    setDraftPeriod({ day: 'monday', start: '09:00', end: '10:00' });
  }

  if (!session) {
    return (
      <main className="page-shell">
        <section className="panel empty-state">
          <h1>Session not found</h1>
          <p>This session only exists in the browser where it was created.</p>
          <button className="primary-button" onClick={onBackHome}>
            Back to home
          </button>
        </section>
      </main>
    );
  }

  const shareLink = `${window.location.origin}/session/${session.id}`;

  return (
    <main className="session-layout">
      <section className="session-header panel">
        <button className="text-button" onClick={onBackHome}>
          Back to home
        </button>
        <div>
          <p className="eyebrow">Group session</p>
          <h1>{session.title}</h1>
          <p>
            {formatDateLabel(session.startDate)} to {formatDateLabel(session.endDate)} -{' '}
            {session.duration} minutes
          </p>
        </div>
        <label className="share-box">
          Shareable link
          <input readOnly value={shareLink} onFocus={(event) => event.target.select()} />
        </label>
      </section>

      <div className="content-grid">
        <AvailabilityCalendar calendarDays={calendarDays} participantCount={participants.length} />

        <aside className="side-stack">
          <section className="panel availability-panel">
            <div className="section-heading">
              <p className="eyebrow">Pass the device around</p>
              <h2>Add one person</h2>
              <p>Save one person, then hand over the phone or laptop for the next response.</p>
            </div>

            <form className="availability-form" onSubmit={saveAvailability}>
              <label>
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Maya"
                />
              </label>

              <div className="period-builder">
                <label>
                  Day
                  <select name="day" value={draftPeriod.day} onChange={updatePeriodField}>
                    {WEEK_DAYS.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  From
                  <input
                    name="start"
                    type="time"
                    min="07:00"
                    max="23:30"
                    value={draftPeriod.start}
                    onChange={updatePeriodField}
                  />
                </label>
                <label>
                  To
                  <input
                    name="end"
                    type="time"
                    value={draftPeriod.end}
                    onChange={updatePeriodField}
                  />
                </label>
                <button className="secondary-button" type="button" onClick={addBusyPeriod}>
                  Add busy time
                </button>
              </div>

              {periods.length > 0 && (
                <ul className="period-list" aria-label="Busy times to save">
                  {periods.map((period, index) => (
                    <li key={`${period.day}-${period.start}-${period.end}-${index}`}>
                      <span>
                        {getDayShortLabel(period.day)} {period.start}-{period.end}
                      </span>
                      <button type="button" onClick={() => removeBusyPeriod(index)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {formError && <p className="error-message">{formError}</p>}
              {savedName && (
                <p className="success-message">
                  Saved {savedName}. Ready for the next person.
                </p>
              )}

              <button className="primary-button" type="submit">
                Save this person
              </button>
            </form>
          </section>
          <ParticipantsList participants={participants} />
        </aside>
      </div>
    </main>
  );
}

function ParticipantsList({ participants }) {
  return (
    <section className="panel mini-panel">
      <h2>Participants</h2>
      {participants.length === 0 ? (
        <p>No one has saved times yet.</p>
      ) : (
        <ul className="simple-list">
          {participants.map((participant) => (
            <li key={participant.name}>
              <span>{participant.name}</span>
              <small>{participant.periods.length} busy periods</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AvailabilityCalendar({ calendarDays, participantCount }) {
  return (
    <section className="panel calendar-panel">
      <div className="calendar-top">
        <div>
          <p className="eyebrow">Everyone free</p>
          <h2>Availability calendar</h2>
        </div>
        <div className="legend">
          <span><i className="legend-free" /> Free</span>
          <span><i className="legend-busy" /> Busy</span>
        </div>
      </div>

      {participantCount === 0 ? (
        <p className="muted-text">Add at least one person to color the calendar.</p>
      ) : (
        <div className="calendar-wrap">
          <div className="week-calendar">
            <div className="time-heading">Time</div>
            {calendarDays.map((day) => (
              <div className="day-heading" key={day.id}>{day.short}</div>
            ))}

            {calendarDays[0]?.slots.map((_, slotIndex) => (
              <React.Fragment key={slotIndex}>
                <div className="calendar-time-label">
                  {formatMinutes(calendarDays[0].slots[slotIndex].start)}
                </div>
                {calendarDays.map((day) => {
                  const slot = day.slots[slotIndex];
                  return (
                  <div
                    className={`calendar-slot ${slot.status}`}
                    key={`${day.id}-${slot.start}`}
                    title={`${day.label} ${formatMinutes(slot.start)}-${formatMinutes(slot.end)}: ${slot.availableCount}/${slot.totalParticipants} available`}
                  />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  function navigate(nextPath) {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  }

  window.onpopstate = () => setPath(window.location.pathname);

  if (path === '/create') {
    return (
      <>
        <TopNav
          onHome={() => navigate('/')}
          onCreate={() => navigate('/create')}
          onRecent={() => navigate('/recent')}
          currentPath={path}
        />
        <CreateSessionPage onSessionCreated={(id) => navigate(`/session/${id}`)} onBackHome={() => navigate('/')} />
      </>
    );
  }

  if (path === '/recent') {
    return (
      <>
        <TopNav
          onHome={() => navigate('/')}
          onCreate={() => navigate('/create')}
          onRecent={() => navigate('/recent')}
          currentPath={path}
        />
        <RecentSessionsPage
          onOpenSession={(id) => navigate(`/session/${id}`)}
          onCreateSession={() => navigate('/create')}
        />
      </>
    );
  }

  if (path.startsWith('/session/')) {
    const sessionId = path.replace('/session/', '');
    return (
      <>
        <TopNav
          onHome={() => navigate('/')}
          onCreate={() => navigate('/create')}
          onRecent={() => navigate('/recent')}
          currentPath={path}
        />
        <SessionPage sessionId={sessionId} onBackHome={() => navigate('/')} />
      </>
    );
  }

  return (
    <>
      <TopNav
        onHome={() => navigate('/')}
        onCreate={() => navigate('/create')}
        onRecent={() => navigate('/recent')}
        currentPath={path}
      />
      <HomePage onCreateSession={() => navigate('/create')} />
    </>
  );
}

function TopNav({ onHome, onCreate, onRecent, currentPath }) {
  return (
    <header className="top-nav">
      <button className="brand-button" onClick={onHome}>
        <span className="brand-dots">
          <i />
          <i />
          <i />
          <i />
        </span>
        StudySync87
      </button>
      <nav>
        <button className={currentPath === '/' ? 'active' : ''} onClick={onHome}>
          Home
        </button>
        <button className={currentPath === '/create' ? 'active' : ''} onClick={onCreate}>
          Create Session
        </button>
        <button className={currentPath === '/recent' ? 'active' : ''} onClick={onRecent}>
          Recent Sessions
        </button>
      </nav>
      <button className="nav-primary" onClick={onCreate}>
        New Session
      </button>
    </header>
  );
}

createRoot(document.getElementById('root')).render(<App />);
