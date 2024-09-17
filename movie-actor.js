const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// PostgreSQL connection pool
const pool = new Pool({
    user: 'postgres',   // replace with your PostgreSQL username
    host: 'localhost',
    database: 'movies-actors-db', // replace with your PostgreSQL database name
    password: 'postgres', // replace with your PostgreSQL password
    port: 5432,
});

app.use(express.json());

// Helper function to check if date is in the future
const isFutureDate = (date) => new Date(date) > new Date();

// Create a new actor
app.post('/actors', async (req, res) => {
    const { firstName, lastName, dateOfBirth } = req.body;

    if (isFutureDate(dateOfBirth)) {
        return res.status(400).json({ message: 'Date of birth cannot be in the future.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO actors (first_name, last_name, date_of_birth) VALUES ($1, $2, $3) RETURNING *',
            [firstName, lastName, dateOfBirth]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating actor' });
    }
});

// Get all actors
app.get('/actors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM actors');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving actors' });
    }
});

// Get actor by ID
app.get('/actors/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM actors WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Actor not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving actor' });
    }
});

// Update an Actor
app.put('/actors/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, dateOfBirth } = req.body;

    try {
        const result = await pool.query(
            'UPDATE actors SET first-name = $1, last_name = $2, date_of_birth = $3 WHERE id = $4 RETURNING *',
            [firstName, lastName, dateOfBirth, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Actor not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating actor' });
    }
});

// Delete an Actor
app.delete('/actors/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM actors WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Actor not found.' });
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting actor' });
    }
});

// Create a new movie with an associated actor
app.post('/movies', async (req, res) => {
    const { title, creationDate, actorId } = req.body;

    try {
        const actorCheck = await pool.query('SELECT * FROM actors WHERE id = $1', [actorId]);

        if (actorCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Actor not found.' });
        }

        const result = await pool.query(
            'INSERT INTO movies (title, creation_date, actor_id) VALUES ($1, $2, $3) RETURNING *',
            [title, creationDate, actorId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating movie' });
    }
});

// Get all movies with associated actors
app.get('/movies', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT movies.id, movies.title, movies.creationDate, actors.firstName, actors.lastName
            FROM movies
            JOIN actors ON movies.actorId = actors.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving movies' });
    }
});

// Get movie by ID
app.get('/movies/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            SELECT movies.id, movies.title, movies.creationDate, actors.firstName, actors.lastName
            FROM movies
            JOIN actors ON movies.actorId = actors.id
            WHERE movies.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Movie not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving movie' });
    }
});

// Update a Movie
app.put('/movies/:id', async (req, res) => {
    const { id } = req.params;
    const { title, creationDate, actorId } = req.body;

    try {
        const result = await pool.query(
            'UPDATE movies SET title = $1, creation_date = $2, actor_id = $3 WHERE id = $4 RETURNING *',
            [title, creationDate, actorId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Movie not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating movie' });
    }
});

// Delete a Movie
app.delete('/movies/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM movies WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Movie not found.' });
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting movie' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Movie-Actor API running on port ${port}`);
});

