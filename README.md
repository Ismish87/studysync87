# StudySync87
## Live Demo

https://studysync87.vercel.app

StudySync87 is a simple React + Vite demo app for finding a free meeting time for any group. It does not require accounts and stores Version 1 data in the browser with `localStorage`.

## Features

- Create a meeting session with a title, date range, and meeting duration.
- Generate a random session ID and a shareable `/session/:sessionId` link.
- Open recently created sessions from a Recent Sessions page.
- Keep the create-session draft in the browser if you click away by mistake.
- Let each participant enter their name.
- Add multiple busy periods for any weekday, such as `Monday 09:00-10:30`.
- Save participant busy periods in `localStorage`.
- Show saved participants.
- Show a weekly availability calendar with green free blocks and red busy blocks.
- Support one-device entry, so a group can pass around a phone or laptop and save each person in the same session.
- Validate required fields, date order, participant name, and busy period time order.
- Responsive plain CSS interface.

## How The Overlap Calculation Works

StudySync87 stores each busy time as a period:

```js
{ day: 'monday', start: '09:00', end: '10:30' }
```

For each weekday, the app gathers every participant's busy periods and merges overlapping ranges. The gaps between those merged busy ranges are the windows when everyone is free.

The calendar is colored in 30-minute blocks from 7:00 AM through 12:00 AM:

- Green: everyone is available.
- Red: at least one participant is unavailable.

## Technologies Used

- React
- Vite
- Plain CSS
- Browser `localStorage`
- Node's built-in test runner

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually `http://localhost:5173`.

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

The production files will be created in the `dist` folder.

## localStorage Limitations

Because Version 1 uses `localStorage`, data is saved only in the current browser on the current device. A shareable link works best as a beginner demo on the same browser where the session was created.

This means:

- Other people on other devices will not automatically see the session.
- Clearing browser storage deletes sessions and participant responses.
- There is no account system, permissions, or real-time syncing.

## Future Improvement

A future version could use Firebase or Supabase as a shared database. That would allow real shareable links, cross-device access, real-time updates, and better long-term storage.
