
require('dotenv').config();
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];

async function main() {
    console.log("Testing Google Calendar Integration...");
    console.log("Client Email:", process.env.GOOGLE_CLIENT_EMAIL);
    console.log("Calendar ID:", process.env.GOOGLE_CALENDAR_ID);

    if (!process.env.GOOGLE_PRIVATE_KEY) {
        console.error("Missing GOOGLE_PRIVATE_KEY");
        return;
    }

    try {
        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_CLIENT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: SCOPES,
        });

        const calendar = google.calendar({ version: 'v3', auth });

        console.log("Attempting to list next 10 events...");
        const response = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log("Events found:", response.data.items?.length);
        if (response.data.items && response.data.items.length > 0) {
            console.log("First event:", response.data.items[0].summary);
        }

        console.log("Attempting to insert a test event...");
        const testEvent = {
            summary: 'Test Event from PierreSite',
            description: 'This is a test event to verify integration.',
            start: {
                dateTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
            },
            end: {
                dateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
            },
        };

        const insertResponse = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            requestBody: testEvent,
        });

        console.log("Test event inserted:", insertResponse.data.htmlLink);

    } catch (error) {
        console.error("Error during test:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error);
        }
    }
}

main();
