import { google } from 'googleapis';

// Requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env
// OR a credentials.json file path

const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];

const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

export async function getBusySlots(start: Date, end: Date) {
    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            items: [{ id: CALENDAR_ID }],
        },
    });

    const busy = response.data.calendars?.[CALENDAR_ID]?.busy || [];

    // Add 15 min buffer to each busy slot (for reading availability)
    return busy.map(slot => ({
        start: slot.start,
        end: new Date(new Date(slot.end!).getTime() + 15 * 60 * 1000).toISOString()
    }))
}

export async function createCalendarEvent(booking: {
    summary: string;
    description: string;
    start: Date;
    end: Date;
    attendeeEmail: string;
}) {
    const event = {
        summary: booking.summary,
        description: booking.description,
        start: {
            dateTime: booking.start.toISOString(),
        },
        end: {
            dateTime: booking.end.toISOString(),
        },
        // attendees: [{ email: booking.attendeeEmail }], // Service accounts cannot invite without Domain-Wide Delegation
    };

    const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: event,
    });

    return response.data;
}

export async function deleteCalendarEvent(eventId: string) {
    try {
        await calendar.events.delete({
            calendarId: CALENDAR_ID,
            eventId: eventId,
        });
        return true;
    } catch (error) {
        console.error("Failed to delete Google Calendar event:", error);
        return false;
    }
}

export async function findCalendarEvent(start: Date, end: Date, summary: string) {
    try {
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            singleEvents: true,
        });

        const events = response.data.items || [];
        return events.find(event => event.summary === summary);
    } catch (error) {
        console.error("Failed to find Google Calendar event:", error);
        return null;
    }
}
