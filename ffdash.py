#!/usr/bin/env python

import sqlite3
import csv
import string
import json
from flask import Flask, request, g, url_for, abort, render_template
from contextlib import closing


DATABASE = 'ffdash.db'
DEBUG = True
SECRET_KEY = 'bazinga'
USERNAME = 'admin'
PASSWORD = 'bazinga'
INPUT = 'ffdash.csv'

sqlite3.register_adapter(bool, int)
sqlite3.register_converter('boolean', lambda b: b != '0')

app = Flask(__name__)
app.config.from_object(__name__)
# app.config.from_envvar('FFDASH_SETTINGS', silent=True)

def connect_db():
    db =  sqlite3.connect(app.config['DATABASE'], detect_types=sqlite3.PARSE_DECLTYPES)
    db.row_factory = sqlite3.Row
    return db

def reset_db():
    with closing(connect_db()) as db:
        with app.open_resource('schema.sql', mode='r') as fd:
            db.cursor().executescript(fd.read())

def import_db():
    db = connect_db()
    cur = db.cursor()
    with open(app.config['INPUT']) as fd:
        reader = csv.reader(fd)
        names = map(string.lower, next(reader))

        cols = ','.join(names)
        values = ','.join(['?'] * len(names))
        query = 'INSERT INTO player (%s) VALUES (%s);' % (cols, values)
        cur.executemany(query, reader)
        db.commit()


def row_to_json(row):
    return dict((name, row[name]) for name in row.keys())

def cursor_to_json(cursor):
    return [row_to_json(row) for row in cursor]

@app.before_request
def before_request():
    g.db = connect_db()

@app.teardown_request
def teardown_request(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()

@app.route('/players')
def players():
    cur = g.db.execute('select * from player order by rank')
    return json.dumps(cursor_to_json(cur))

@app.route('/players', methods=['POST'])
def save():
    for player in request.json:
        print(player)
        taken = 1 if player['taken'] else 0
        id = player['id']
        g.db.execute('update player set taken=%d where id=%d' % (taken, id))
    g.db.commit()
    return ''

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run()
