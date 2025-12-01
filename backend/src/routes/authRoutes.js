import express from 'express';
import axios from 'axios';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.post('/strava', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
    }

    try {
        console.log('Attempting Strava Auth with:', {
            client_id: process.env.STRAVA_CLIENT_ID,
            has_secret: !!process.env.STRAVA_CLIENT_SECRET,
            code_length: code?.length
        });

        // 1. Exchange code for tokens
        const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
        });

        const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

        // 2. Upsert user in database
        const [user] = await db.insert(users).values({
            stravaAthleteId: athlete.id,
            username: athlete.username || `${athlete.firstname} ${athlete.lastname}`,
            email: null, // Strava doesn't always return email, and we might not need it
            profilePhotoUrl: athlete.profile,
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiresAt: new Date(expires_at * 1000),
        }).onConflictDoUpdate({
            target: users.stravaAthleteId,
            set: {
                accessToken: access_token,
                refreshToken: refresh_token,
                tokenExpiresAt: new Date(expires_at * 1000),
                profilePhotoUrl: athlete.profile,
                username: athlete.username || `${athlete.firstname} ${athlete.lastname}`,
                updatedAt: new Date(),
            },
        }).returning();

        res.json({ user });

    } catch (error) {
        console.error('Strava Auth Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to authenticate with Strava' });
    }
});

export default router;
