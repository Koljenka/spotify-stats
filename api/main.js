const express = require('express');
const https = require("https");
const fs = require('fs');
const mysql = require('mysql');

const pool = mysql.createPool({
	host: 'localhost',
	user: 'phpmyadmin',
	password: 'ut6rF7=$7v=YcAEZ',
	database: 'spotify-history'
});

const app = express();
app.use(express.json());

app.post('/history', (req, res) => {
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	const {access_token} = req.body;

	https.get({
		headers: {'Authorization': 'Bearer ' + access_token},
		host: 'api.spotify.com',
		port: 443,
		path: '/v1/me/'
	}, value => {

		if (value.statusCode !== 200) {
			res.status(401);
			res.end()
		} else {
			value.on('data', data => {
				const userId = JSON.parse(String(data)).id;
				pool.query('SELECT DISTINCT trackid, contexturi, played_at FROM playback JOIN user ON userid = user.id WHERE sid = ? ORDER BY played_at DESC', [userId], function (error, results, fields) {
					if (error) res.json(error).status(500).end();
					res.json(results).end();
				});

			})
		}
	});
});

app.post('/top', (req, res) => {
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	const {access_token} = req.body;

	https.get({
		headers: {'Authorization': 'Bearer ' + access_token},
		host: 'api.spotify.com',
		port: 443,
		path: '/v1/me/'
	}, value => {

		if (value.statusCode !== 200) {
			res.status(401);
			res.end()
		} else {
			value.on('data', data => {
				const userId = JSON.parse(String(data)).id;
				pool.query(`SELECT DISTINCT playback.trackid, c
                            FROM playback
                                     JOIN user ON userid = user.id
                                     JOIN track t on playback.trackid = t.id
                                     JOIN (SELECT trackid, count(*) as c
                                           FROM playback
                                                    JOIN user ON userid = user.id
                                           WHERE sid = ?
                                           GROUP BY trackid
                                           order by c desc) as count ON playback.trackid = count.trackid
                            WHERE sid = ?
                            ORDER BY c DESC
                            LIMIT 200;`,
					[userId, userId], function (error, results, fields) {
						if (error) res.json(error).status(500).end();
						res.json(results).end();
					});

			})
		}
	});
});

app.post('/contextOfTrack', (req, res) => {
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	const {access_token, track_id} = req.body;

	https.get({
		headers: {'Authorization': 'Bearer ' + access_token},
		host: 'api.spotify.com',
		port: 443,
		path: '/v1/me/'
	}, value => {

		if (value.statusCode !== 200) {
			res.status(401);
			res.end()
		} else {
			value.on('data', data => {
				const userId = JSON.parse(String(data)).id;
				pool.query(`
                            select distinct playback.trackid, playback.contexturi
                            from playback
                                     join user u on playback.userid = u.id
                            where sid = ?
                              and trackid = ?
                            order by trackid desc;`
					, [userId, track_id], function (error, results, fields) {
						if (error) res.json(error).status(500).end();
						res.json(results).end();
					});

			})
		}
	});
});

const options = {
	key: fs.readFileSync("/etc/letsencrypt/live/justusdieckmann.de/privkey.pem"),
	cert: fs.readFileSync("/etc/letsencrypt/live/justusdieckmann.de/fullchain.pem")
};
https.createServer(options, app).listen(8090);
